-- =====================================================================
-- Mezuzah order site - cart orders (stage B)
-- Copy this whole file into Supabase > SQL Editor and press "Run".
-- Run it AFTER schema.sql and prices.sql. It is safe to run more than
-- once (idempotent): nothing is deleted and existing data is kept.
--
-- What it does
--   1. orders        + total_amount_agorot (the order total) and
--                    + client_token (stops duplicate orders on double clicks
--                      or a flaky network). The old single-product columns stay
--                      (they become optional) - NOTHING is dropped.
--   2. order_items   one row per item of an order, with a full snapshot of
--                    names, colours and PRICES at the time of the order.
--   3. migration     every existing order becomes an order with ONE item
--                    (quantity 1, price "unknown" - shown as a dash).
--   4. create_cart_order()   the only door for customers: receives only ids,
--                    text and quantity - reads the prices from the database,
--                    computes the total itself and refuses the order if the
--                    total the customer saw is no longer the real one.
--   5. create_order()   keeps its old signature and now delegates to
--                    create_cart_order(), so the website that is live today
--                    keeps working while you deploy.
--   6. RLS + grants  order_items can be read by admins only; nobody can
--                    insert / update / delete it through the API.
--
-- Money is always a whole number of AGOROT (4990 = 49.90 shekels).
-- =====================================================================


-- ---------------------------------------------------------------------
-- 0. Stage A must have been applied (prices.sql)
-- ---------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'models' and column_name = 'price_agorot'
  ) then
    raise exception 'Run supabase/prices.sql first (models.price_agorot is missing).';
  end if;
end
$$;


-- ---------------------------------------------------------------------
-- 1. orders: total + duplicate-protection token; legacy columns become optional
-- ---------------------------------------------------------------------
alter table public.orders add column if not exists total_amount_agorot integer
  check (total_amount_agorot is null or total_amount_agorot >= 0);
alter table public.orders add column if not exists client_token uuid;

-- one order per token (many orders without a token are fine)
create unique index if not exists orders_client_token_key on public.orders (client_token);

-- The single-product columns are now only a mirror of the FIRST item (kept so older
-- screens keep working during the rollout). Dropping NOT NULL deletes nothing.
alter table public.orders alter column model_name drop not null;
alter table public.orders alter column body_color_name drop not null;
alter table public.orders alter column body_color_hex drop not null;
alter table public.orders alter column fill_type drop not null;


-- ---------------------------------------------------------------------
-- 2. order_items
-- ---------------------------------------------------------------------
create table if not exists public.order_items (
  id                 uuid primary key default gen_random_uuid(),
  order_id           uuid not null references public.orders (id) on delete cascade,
  line_number        integer not null,

  model_id           uuid references public.models (id) on delete set null,
  model_name         text not null,
  model_image_url    text,

  body_color_id      uuid references public.colors (id) on delete set null,
  body_color_name    text not null,
  body_color_hex     text not null,

  fill_type          text not null check (fill_type in ('none', 'single')),
  fill_color_id      uuid references public.colors (id) on delete set null,
  fill_color_name    text,
  fill_color_hex     text,

  personal_text      text check (char_length(personal_text) <= 30),

  quantity           integer not null check (quantity between 1 and 20),
  -- NULL only for orders that were placed before prices existed
  unit_price_agorot  integer check (unit_price_agorot is null or unit_price_agorot >= 0),
  line_total_agorot  integer check (line_total_agorot is null or line_total_agorot >= 0),

  constraint order_items_fill_consistent check ((fill_type = 'single') = (fill_color_name is not null)),
  constraint order_items_line_total_consistent
    check (unit_price_agorot is null or line_total_agorot = unit_price_agorot * quantity)
);

create index if not exists order_items_order_idx on public.order_items (order_id, line_number);


-- ---------------------------------------------------------------------
-- 3. Migration: every existing order gets ONE item copied from its own columns.
--    Runs only for orders that have no items yet, so it is safe to repeat.
-- ---------------------------------------------------------------------
insert into public.order_items (
  order_id, line_number,
  model_id, model_name, model_image_url,
  body_color_id, body_color_name, body_color_hex,
  fill_type, fill_color_id, fill_color_name, fill_color_hex,
  personal_text, quantity, unit_price_agorot, line_total_agorot
)
select
  o.id, 1,
  o.model_id, o.model_name, o.model_image_url,
  o.body_color_id, o.body_color_name, o.body_color_hex,
  o.fill_type, o.fill_color_id, o.fill_color_name, o.fill_color_hex,
  o.personal_text, 1, null, null
from public.orders o
where o.model_name is not null
  and o.body_color_name is not null
  and o.body_color_hex is not null
  and o.fill_type is not null
  and not exists (select 1 from public.order_items i where i.order_id = o.id);


-- ---------------------------------------------------------------------
-- 4. create_cart_order(): the only door for customers
--    p_items = [{ "model_id", "body_color_id", "fill_type", "fill_color_id",
--                 "personal_text", "quantity" }, ...]   (NO prices, NO names)
--    Everything else is read from the catalog here. Returns
--    { order_number, total_amount_agorot, duplicate }.
--    Errors (the website maps them to friendly messages):
--      price_changed   the total the customer saw is not the real total any more
--      price_not_set   a model has no price
--      invalid_*       something is unavailable or malformed
-- ---------------------------------------------------------------------
create or replace function public.create_cart_order(
  p_items                 jsonb,
  p_customer_name         text,
  p_phone                 text,
  p_customer_note         text,
  p_expected_total_agorot integer default null,
  p_client_token          uuid    default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name     text := btrim(coalesce(p_customer_name, ''));
  v_phone    text := btrim(coalesce(p_phone, ''));
  v_note     text := nullif(btrim(coalesce(p_customer_note, '')), '');
  v_elem     jsonb;
  v_line     integer := 0;
  v_model    public.models;
  v_body     public.colors;
  v_fill     public.fills;
  v_fcolor   public.colors;
  v_model_id uuid;
  v_body_id  uuid;
  v_fcol_id  uuid;
  v_fill_id  text;
  v_text     text;
  v_qty      integer;
  v_unit     integer;
  v_line_sum integer;
  v_total    integer := 0;
  v_rows     jsonb := '[]'::jsonb;
  v_first    jsonb;
  v_order_id uuid;
  v_number   text;
  v_prev     record;
begin
  -- A retry of an order that was already saved returns that order instead of a second one.
  if p_client_token is not null then
    select o.order_number, o.total_amount_agorot into v_prev
    from public.orders o where o.client_token = p_client_token;
    if found then
      return jsonb_build_object('order_number', v_prev.order_number,
                                'total_amount_agorot', v_prev.total_amount_agorot,
                                'duplicate', true);
    end if;
  end if;

  if char_length(v_name) < 2 or char_length(v_name) > 100 then
    raise exception 'invalid_name' using errcode = '22023';
  end if;
  if v_phone !~ '^[0-9+\-\s().]{9,20}$' then
    raise exception 'invalid_phone' using errcode = '22023';
  end if;
  if v_note is not null and char_length(v_note) > 1000 then
    raise exception 'invalid_note' using errcode = '22023';
  end if;

  -- 1..20 different lines
  if p_items is null or jsonb_typeof(p_items) <> 'array'
     or jsonb_array_length(p_items) < 1 or jsonb_array_length(p_items) > 20 then
    raise exception 'invalid_items' using errcode = '22023';
  end if;

  -- Pass 1: validate every line and price it from the database. Nothing is written yet,
  -- so a refused order never uses up an order number.
  for v_elem in select value from jsonb_array_elements(p_items) loop
    v_line := v_line + 1;
    v_fcolor := null;

    if jsonb_typeof(v_elem) <> 'object' then
      raise exception 'invalid_items' using errcode = '22023';
    end if;

    begin
      v_model_id := nullif(v_elem->>'model_id', '')::uuid;
      v_body_id  := nullif(v_elem->>'body_color_id', '')::uuid;
      v_fcol_id  := nullif(v_elem->>'fill_color_id', '')::uuid;
    exception when invalid_text_representation then
      raise exception 'invalid_items' using errcode = '22023';
    end;
    v_fill_id := v_elem->>'fill_type';
    v_text    := nullif(btrim(coalesce(v_elem->>'personal_text', '')), '');

    if jsonb_typeof(v_elem->'quantity') is distinct from 'number'
       or (v_elem->>'quantity') !~ '^[0-9]{1,2}$' then
      raise exception 'invalid_quantity' using errcode = '22023';
    end if;
    v_qty := (v_elem->>'quantity')::integer;
    if v_qty < 1 or v_qty > 20 then
      raise exception 'invalid_quantity' using errcode = '22023';
    end if;

    -- Hebrew letters / niqqud / spaces / geresh / gershayim / quotes / hyphen only
    if v_text is not null and (
         char_length(v_text) > 30
         or v_text !~ '^[א-תְ-ׇ\s׳״''"\-]+$'
       ) then
      raise exception 'invalid_text' using errcode = '22023';
    end if;

    select * into v_model from public.models where id = v_model_id and active;
    if not found then raise exception 'invalid_model' using errcode = '22023'; end if;
    if v_model.price_agorot is null then raise exception 'price_not_set' using errcode = '22023'; end if;

    select * into v_body from public.colors where id = v_body_id and available;
    if not found then raise exception 'invalid_color' using errcode = '22023'; end if;

    select * into v_fill from public.fills where id = v_fill_id and available;
    if not found then raise exception 'invalid_fill' using errcode = '22023'; end if;

    if v_fill.id = 'single' then
      select * into v_fcolor from public.colors where id = v_fcol_id and available;
      if not found then raise exception 'invalid_fill_color' using errcode = '22023'; end if;
    end if;

    v_unit     := v_model.price_agorot;
    v_line_sum := v_unit * v_qty;
    v_total    := v_total + v_line_sum;

    v_rows := v_rows || jsonb_build_array(jsonb_build_object(
      'line_number',       v_line,
      'model_id',          v_model.id,
      'model_name',        v_model.name,
      'model_image_url',   v_model.image_url,
      'body_color_id',     v_body.id,
      'body_color_name',   v_body.name,
      'body_color_hex',    v_body.hex,
      'fill_type',         v_fill.id,
      'fill_color_id',     v_fcolor.id,
      'fill_color_name',   v_fcolor.name,
      'fill_color_hex',    v_fcolor.hex,
      'personal_text',     v_text,
      'quantity',          v_qty,
      'unit_price_agorot', v_unit,
      'line_total_agorot', v_line_sum
    ));
  end loop;

  -- The customer must have seen exactly the total the database just computed.
  if p_expected_total_agorot is not null and p_expected_total_agorot <> v_total then
    raise exception 'price_changed' using errcode = '22023';
  end if;

  -- Pass 2: write. The columns of the first item are mirrored on the order itself.
  v_first := v_rows -> 0;
  begin
    insert into public.orders (
      customer_name, phone, customer_note, total_amount_agorot, client_token,
      model_id, model_name, model_image_url,
      body_color_id, body_color_name, body_color_hex,
      fill_type, fill_color_id, fill_color_name, fill_color_hex,
      personal_text
    ) values (
      v_name, v_phone, v_note, v_total, p_client_token,
      (v_first->>'model_id')::uuid, v_first->>'model_name', v_first->>'model_image_url',
      (v_first->>'body_color_id')::uuid, v_first->>'body_color_name', v_first->>'body_color_hex',
      v_first->>'fill_type', nullif(v_first->>'fill_color_id', '')::uuid,
      v_first->>'fill_color_name', v_first->>'fill_color_hex',
      v_first->>'personal_text'
    )
    returning id, order_number into v_order_id, v_number;
  exception when unique_violation then
    -- two identical submissions at the very same moment: hand back the first one
    if p_client_token is null then raise; end if;
    select o.order_number, o.total_amount_agorot into v_prev
    from public.orders o where o.client_token = p_client_token;
    return jsonb_build_object('order_number', v_prev.order_number,
                              'total_amount_agorot', v_prev.total_amount_agorot,
                              'duplicate', true);
  end;

  insert into public.order_items (
    order_id, line_number,
    model_id, model_name, model_image_url,
    body_color_id, body_color_name, body_color_hex,
    fill_type, fill_color_id, fill_color_name, fill_color_hex,
    personal_text, quantity, unit_price_agorot, line_total_agorot
  )
  select
    v_order_id, x.line_number,
    x.model_id, x.model_name, x.model_image_url,
    x.body_color_id, x.body_color_name, x.body_color_hex,
    x.fill_type, x.fill_color_id, x.fill_color_name, x.fill_color_hex,
    x.personal_text, x.quantity, x.unit_price_agorot, x.line_total_agorot
  from jsonb_to_recordset(v_rows) as x(
    line_number integer,
    model_id uuid, model_name text, model_image_url text,
    body_color_id uuid, body_color_name text, body_color_hex text,
    fill_type text, fill_color_id uuid, fill_color_name text, fill_color_hex text,
    personal_text text, quantity integer, unit_price_agorot integer, line_total_agorot integer
  );

  return jsonb_build_object('order_number', v_number,
                            'total_amount_agorot', v_total,
                            'duplicate', false);
end;
$$;

revoke all on function public.create_cart_order(jsonb, text, text, text, integer, uuid) from public;
grant execute on function public.create_cart_order(jsonb, text, text, text, integer, uuid) to anon, authenticated;


-- ---------------------------------------------------------------------
-- 5. create_order(): same signature as before, now a thin wrapper (one item, quantity 1).
--    The website that is live today keeps working while the new one is deployed.
-- ---------------------------------------------------------------------
create or replace function public.create_order(
  p_model_id        uuid,
  p_body_color_id   uuid,
  p_fill_type       text,
  p_fill_color_id   uuid,
  p_personal_text   text,
  p_customer_name   text,
  p_phone           text,
  p_customer_note   text
)
returns text
language plpgsql
security definer
set search_path = public
as $$
begin
  return (public.create_cart_order(
    jsonb_build_array(jsonb_build_object(
      'model_id',        p_model_id,
      'body_color_id',   p_body_color_id,
      'fill_type',       p_fill_type,
      'fill_color_id',   p_fill_color_id,
      'personal_text',   p_personal_text,
      'quantity',        1
    )),
    p_customer_name, p_phone, p_customer_note, null, null
  ))->>'order_number';
end;
$$;

revoke all on function public.create_order(uuid, uuid, text, uuid, text, text, text, text) from public;
grant execute on function public.create_order(uuid, uuid, text, uuid, text, text, text, text) to anon, authenticated;


-- ---------------------------------------------------------------------
-- 6. Row Level Security + explicit grants for order_items
--    Admins read; nobody inserts / updates / deletes through the API
--    (only create_cart_order, which runs with owner rights, writes items).
-- ---------------------------------------------------------------------
alter table public.order_items enable row level security;

drop policy if exists "Admin reads order items" on public.order_items;
create policy "Admin reads order items" on public.order_items
  for select to authenticated using (public.is_admin());

revoke all on public.order_items from anon, authenticated;
grant select on public.order_items to authenticated;


-- ---------------------------------------------------------------------
-- 7. Let the API see the new table / columns / function right away
-- ---------------------------------------------------------------------
notify pgrst, 'reload schema';


-- ---------------------------------------------------------------------
-- 8. Check
--    Table Editor > order_items has one row per old order (price empty),
--    and orders has the new columns total_amount_agorot and client_token.
-- ---------------------------------------------------------------------
