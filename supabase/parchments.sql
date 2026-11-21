-- =====================================================================
-- Mezuzah order site - parchment (klaf) add-on
-- Copy this whole file into Supabase > SQL Editor and press "Run".
-- Run it AFTER schema.sql, prices.sql and cart-orders.sql. It is safe to run
-- more than once (idempotent): nothing is deleted and existing data is kept.
--
-- What it does
--   1. parchments      the catalog of parchments you manage in the admin panel:
--                      name, short description, optional note, size (cm), price,
--                      available / not available, display order.
--   2. order_items     + has_parchment, parchment_id, parchment_name,
--                      parchment_size_cm, parchment_price_agorot: a SNAPSHOT of the
--                      parchment (name and price at the time of the order).
--                      unit_price_agorot of a line now = mezuzah + parchment, so the
--                      existing rule  line_total = unit_price x quantity  still holds.
--   3. create_cart_order()   replaced by a version that also understands an optional
--                      "parchment_id" on each item. The browser sends only the id: the
--                      database reads the parchment price itself, adds it to the
--                      mezuzah price, and refuses the order ("price_changed") if the
--                      total the customer saw is no longer the real one.
--                      Items WITHOUT parchment_id behave exactly as before.
--   4. RLS + grants    everyone may read AVAILABLE parchments; only admins write.
--
-- Money is always a whole number of AGOROT (3000 = 30 shekels).
--
-- Note: if you ever run cart-orders.sql again later, run this file again right
-- after it, because cart-orders.sql contains the older version of create_cart_order().
-- =====================================================================


-- ---------------------------------------------------------------------
-- 0. The earlier steps must have been applied
-- ---------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'order_items'
  ) then
    raise exception 'Run supabase/cart-orders.sql first (table order_items is missing).';
  end if;
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'models' and column_name = 'price_agorot'
  ) then
    raise exception 'Run supabase/prices.sql first (models.price_agorot is missing).';
  end if;
end
$$;


-- ---------------------------------------------------------------------
-- 1. Helper used by the updated_at trigger (same definition as schema.sql)
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


-- ---------------------------------------------------------------------
-- 2. parchments - the catalog
--    A parchment can only be "available" when it has a price (the last rule below).
-- ---------------------------------------------------------------------
create table if not exists public.parchments (
  id            uuid primary key default gen_random_uuid(),
  -- shown to customers exactly as typed, e.g. "קלף 12 ס״מ" or "קלף כשר 12 ס״מ"
  name          text not null check (char_length(btrim(name)) between 1 and 80),
  -- short line shown under the name, e.g. "מתאים לבית המזוזה" (optional)
  description   text check (description is null or char_length(description) <= 200),
  -- extra information for customers, for later use (optional)
  note          text check (note is null or char_length(note) <= 500),
  size_cm       integer not null check (size_cm between 1 and 100),
  -- whole agorot, VAT included; NULL = no price yet
  price_agorot  integer check (price_agorot is null or price_agorot between 1 and 1000000),
  available     boolean not null default false,
  sort_order    integer not null default 100,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint parchments_available_needs_price check (not available or price_agorot is not null)
);

drop trigger if exists parchments_set_updated_at on public.parchments;
create trigger parchments_set_updated_at before update on public.parchments
  for each row execute function public.set_updated_at();

-- One starting row, only when the table is empty. It stays "not available" until you give it a
-- price in the admin panel (Parchments page) and switch it on. Rename it there as you like.
insert into public.parchments (name, description, size_cm, available, sort_order)
select 'קלף כשר', 'מתאים לבית המזוזה', 12, false, 10
where not exists (select 1 from public.parchments);


-- ---------------------------------------------------------------------
-- 3. Privileges + Row Level Security for parchments
--    (new Supabase projects do not grant table privileges automatically)
-- ---------------------------------------------------------------------
alter table public.parchments enable row level security;

drop policy if exists "Public reads available parchments" on public.parchments;
create policy "Public reads available parchments" on public.parchments
  for select to anon, authenticated using (available);

drop policy if exists "Admin reads all parchments" on public.parchments;
create policy "Admin reads all parchments" on public.parchments
  for select to authenticated using (public.is_admin());

drop policy if exists "Admin inserts parchments" on public.parchments;
create policy "Admin inserts parchments" on public.parchments
  for insert to authenticated with check (public.is_admin());

drop policy if exists "Admin updates parchments" on public.parchments;
create policy "Admin updates parchments" on public.parchments
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admin deletes parchments" on public.parchments;
create policy "Admin deletes parchments" on public.parchments
  for delete to authenticated using (public.is_admin());

revoke all on public.parchments from anon, authenticated;
grant select on public.parchments to anon, authenticated;
grant insert, update, delete on public.parchments to authenticated;


-- ---------------------------------------------------------------------
-- 4. order_items: snapshot columns (existing rows simply get "no parchment")
-- ---------------------------------------------------------------------
alter table public.order_items add column if not exists has_parchment boolean not null default false;
-- deleting a parchment from the catalog never breaks an order: the snapshot below stays
alter table public.order_items add column if not exists parchment_id uuid references public.parchments (id) on delete set null;
alter table public.order_items add column if not exists parchment_name text;
alter table public.order_items add column if not exists parchment_size_cm integer;
-- price of the parchment per unit, already INCLUDED in unit_price_agorot
alter table public.order_items add column if not exists parchment_price_agorot integer
  check (parchment_price_agorot is null or parchment_price_agorot >= 1);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'order_items_parchment_consistent') then
    alter table public.order_items
      add constraint order_items_parchment_consistent check (
        (has_parchment and parchment_name is not null and parchment_price_agorot is not null)
        or
        (not has_parchment and parchment_name is null and parchment_size_cm is null and parchment_price_agorot is null)
      );
  end if;
  if not exists (select 1 from pg_constraint where conname = 'order_items_parchment_within_unit_price') then
    alter table public.order_items
      add constraint order_items_parchment_within_unit_price check (
        parchment_price_agorot is null or unit_price_agorot is null or parchment_price_agorot <= unit_price_agorot
      );
  end if;
end
$$;


-- ---------------------------------------------------------------------
-- 5. create_cart_order(): now understands an optional parchment on each item
--    p_items = [{ "model_id", "body_color_id", "fill_type", "fill_color_id",
--                 "personal_text", "quantity", "parchment_id" (optional) }, ...]
--    (NO prices, NO names.) Returns { order_number, total_amount_agorot, duplicate }.
--    Errors (the website maps them to friendly messages):
--      price_changed       the total the customer saw is not the real total any more
--      price_not_set       a model (or parchment) has no price
--      invalid_parchment   the parchment does not exist or is not available
--      invalid_*           something else is unavailable or malformed
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
  v_parch    public.parchments;
  v_model_id uuid;
  v_body_id  uuid;
  v_fcol_id  uuid;
  v_parch_id uuid;
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
    v_parch  := null;

    if jsonb_typeof(v_elem) <> 'object' then
      raise exception 'invalid_items' using errcode = '22023';
    end if;

    begin
      v_model_id := nullif(v_elem->>'model_id', '')::uuid;
      v_body_id  := nullif(v_elem->>'body_color_id', '')::uuid;
      v_fcol_id  := nullif(v_elem->>'fill_color_id', '')::uuid;
      v_parch_id := nullif(v_elem->>'parchment_id', '')::uuid;
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

    -- Optional parchment: must exist, be available and have a price.
    v_unit := v_model.price_agorot;
    if v_parch_id is not null then
      select * into v_parch from public.parchments where id = v_parch_id and available;
      if not found then raise exception 'invalid_parchment' using errcode = '22023'; end if;
      if v_parch.price_agorot is null then raise exception 'price_not_set' using errcode = '22023'; end if;
      v_unit := v_unit + v_parch.price_agorot;
    end if;

    v_line_sum := v_unit * v_qty;
    v_total    := v_total + v_line_sum;

    v_rows := v_rows || jsonb_build_array(jsonb_build_object(
      'line_number',            v_line,
      'model_id',               v_model.id,
      'model_name',             v_model.name,
      'model_image_url',        v_model.image_url,
      'body_color_id',          v_body.id,
      'body_color_name',        v_body.name,
      'body_color_hex',         v_body.hex,
      'fill_type',              v_fill.id,
      'fill_color_id',          v_fcolor.id,
      'fill_color_name',        v_fcolor.name,
      'fill_color_hex',         v_fcolor.hex,
      'personal_text',          v_text,
      'quantity',               v_qty,
      'unit_price_agorot',      v_unit,
      'line_total_agorot',      v_line_sum,
      'has_parchment',          (v_parch.id is not null),
      'parchment_id',           v_parch.id,
      'parchment_name',         v_parch.name,
      'parchment_size_cm',      v_parch.size_cm,
      'parchment_price_agorot', v_parch.price_agorot
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
    personal_text, quantity, unit_price_agorot, line_total_agorot,
    has_parchment, parchment_id, parchment_name, parchment_size_cm, parchment_price_agorot
  )
  select
    v_order_id, x.line_number,
    x.model_id, x.model_name, x.model_image_url,
    x.body_color_id, x.body_color_name, x.body_color_hex,
    x.fill_type, x.fill_color_id, x.fill_color_name, x.fill_color_hex,
    x.personal_text, x.quantity, x.unit_price_agorot, x.line_total_agorot,
    x.has_parchment, x.parchment_id, x.parchment_name, x.parchment_size_cm, x.parchment_price_agorot
  from jsonb_to_recordset(v_rows) as x(
    line_number integer,
    model_id uuid, model_name text, model_image_url text,
    body_color_id uuid, body_color_name text, body_color_hex text,
    fill_type text, fill_color_id uuid, fill_color_name text, fill_color_hex text,
    personal_text text, quantity integer, unit_price_agorot integer, line_total_agorot integer,
    has_parchment boolean, parchment_id uuid, parchment_name text, parchment_size_cm integer,
    parchment_price_agorot integer
  );

  return jsonb_build_object('order_number', v_number,
                            'total_amount_agorot', v_total,
                            'duplicate', false);
end;
$$;

revoke all on function public.create_cart_order(jsonb, text, text, text, integer, uuid) from public;
grant execute on function public.create_cart_order(jsonb, text, text, text, integer, uuid) to anon, authenticated;


-- ---------------------------------------------------------------------
-- 6. Let the API see the new table / columns / function right away
-- ---------------------------------------------------------------------
notify pgrst, 'reload schema';


-- ---------------------------------------------------------------------
-- 7. Check
--    Table Editor > parchments has one row ("קלף כשר", 12 cm, not available, no price).
--    Open the admin panel > Parchments, set the price and switch it on.
--    order_items has the new columns has_parchment, parchment_name, ...
-- ---------------------------------------------------------------------
