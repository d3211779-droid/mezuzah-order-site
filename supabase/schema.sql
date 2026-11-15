-- =====================================================================
-- Mezuzah order site - Supabase schema
-- Copy this whole file into Supabase > SQL Editor and press "Run".
-- It is safe to run more than once (idempotent): existing data is kept.
--
-- What it creates
--   1. admins            who may use the admin panel (manual, see step 9 at the bottom)
--   2. models / colors / fills   the catalog the customer page reads
--   3. orders            customer orders (never readable by the public)
--   4. create_order()    the ONLY way a customer can create an order
--   5. RLS policies + a public Storage bucket for model photos
--   6. starter catalog (only inserted when the tables are empty)
-- =====================================================================


-- ---------------------------------------------------------------------
-- 0. Shared helper: keep updated_at fresh
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
-- 1. Admins
-- A Supabase Auth user is an admin only if listed here. This keeps the
-- panel safe even if someone manages to sign up to the project.
-- ---------------------------------------------------------------------
create table if not exists public.admins (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admins enable row level security;
-- No policies on purpose: nobody can read or edit this table through the API.
revoke all on public.admins from anon, authenticated;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;


-- ---------------------------------------------------------------------
-- 2. Catalog tables
-- ---------------------------------------------------------------------
create table if not exists public.models (
  id            uuid primary key default gen_random_uuid(),
  name          text not null check (char_length(btrim(name)) between 1 and 80),
  image_url     text not null,
  active        boolean not null default true,
  sort_order    integer not null default 0,
  -- Optional: data for the live colour preview. A model without them is still
  -- orderable; the preview simply shows the original photo.
  fit           jsonb,   -- {"cx":497,"cy":529,"h":833,"tilt":-5.4}
  mask_body_url text,
  mask_fill_url text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists public.colors (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (char_length(btrim(name)) between 1 and 40),
  hex        text not null check (hex ~ '^#[0-9A-Fa-f]{6}$'),
  available  boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Fill types are fixed for now: 'none' and 'single' (one colour).
create table if not exists public.fills (
  id          text primary key check (id in ('none', 'single')),
  name        text not null check (char_length(btrim(name)) between 1 and 40),
  description text,
  available   boolean not null default true,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists models_sort_idx on public.models (sort_order, created_at);
create index if not exists colors_sort_idx on public.colors (sort_order, created_at);
create index if not exists fills_sort_idx  on public.fills  (sort_order);

drop trigger if exists models_set_updated_at on public.models;
create trigger models_set_updated_at before update on public.models
  for each row execute function public.set_updated_at();

drop trigger if exists colors_set_updated_at on public.colors;
create trigger colors_set_updated_at before update on public.colors
  for each row execute function public.set_updated_at();

drop trigger if exists fills_set_updated_at on public.fills;
create trigger fills_set_updated_at before update on public.fills
  for each row execute function public.set_updated_at();


-- ---------------------------------------------------------------------
-- 3. Orders
-- Each order stores both the ids AND the names/values the customer chose, so
-- later catalog edits never change old orders. The *_id columns become NULL
-- (the order stays) if a catalog row is ever deleted.
-- ---------------------------------------------------------------------
create sequence if not exists public.order_number_seq start with 1001;

create table if not exists public.orders (
  id                uuid primary key default gen_random_uuid(),
  -- MZ-1001, MZ-1002 ... from a sequence: unique, never random, never collides.
  order_number      text not null unique default ('MZ-' || nextval('public.order_number_seq')),
  created_at        timestamptz not null default now(),

  customer_name     text not null check (char_length(btrim(customer_name)) between 2 and 100),
  phone             text not null check (char_length(btrim(phone)) between 9 and 20),
  customer_note     text check (char_length(customer_note) <= 1000),

  model_id          uuid references public.models (id) on delete set null,
  model_name        text not null,
  model_image_url   text,

  body_color_id     uuid references public.colors (id) on delete set null,
  body_color_name   text not null,
  body_color_hex    text not null,

  fill_type         text not null check (fill_type in ('none', 'single')),
  fill_color_id     uuid references public.colors (id) on delete set null,
  fill_color_name   text,
  fill_color_hex    text,

  personal_text     text check (char_length(personal_text) <= 30),

  internal_note     text check (char_length(internal_note) <= 4000),
  status            text not null default 'new' check (status in ('new', 'printing', 'ready', 'delivered')),

  -- a "single colour" fill must carry its colour; "none" must not
  constraint orders_fill_consistent check ((fill_type = 'single') = (fill_color_name is not null))
);

create index if not exists orders_created_idx      on public.orders (created_at desc);
create index if not exists orders_status_idx       on public.orders (status, created_at desc);
create index if not exists orders_phone_idx        on public.orders (phone);
create index if not exists orders_customer_idx     on public.orders (lower(customer_name));


-- ---------------------------------------------------------------------
-- 4. create_order(): the only door for customers
-- Runs with owner rights, re-reads the catalog itself (so names/colours cannot
-- be forged by the browser), validates input and inserts the order.
-- Returns the new order number, e.g. 'MZ-1001'.
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
declare
  v_model   public.models;
  v_body    public.colors;
  v_fill    public.fills;
  v_fcolor  public.colors;
  v_name    text := btrim(coalesce(p_customer_name, ''));
  v_phone   text := btrim(coalesce(p_phone, ''));
  v_text    text := nullif(btrim(coalesce(p_personal_text, '')), '');
  v_note    text := nullif(btrim(coalesce(p_customer_note, '')), '');
  v_number  text;
begin
  if char_length(v_name) < 2 or char_length(v_name) > 100 then
    raise exception 'invalid_name' using errcode = '22023';
  end if;

  if v_phone !~ '^[0-9+\-\s().]{9,20}$' then
    raise exception 'invalid_phone' using errcode = '22023';
  end if;

  -- Hebrew letters / niqqud / spaces / geresh / gershayim / quotes / hyphen only
  if v_text is not null and (
       char_length(v_text) > 30
       or v_text !~ '^[א-תְ-ׇ\s׳״''"\-]+$'
     ) then
    raise exception 'invalid_text' using errcode = '22023';
  end if;

  if v_note is not null and char_length(v_note) > 1000 then
    raise exception 'invalid_note' using errcode = '22023';
  end if;

  select * into v_model from public.models where id = p_model_id and active;
  if not found then raise exception 'invalid_model' using errcode = '22023'; end if;

  select * into v_body from public.colors where id = p_body_color_id and available;
  if not found then raise exception 'invalid_color' using errcode = '22023'; end if;

  select * into v_fill from public.fills where id = p_fill_type and available;
  if not found then raise exception 'invalid_fill' using errcode = '22023'; end if;

  if v_fill.id = 'single' then
    select * into v_fcolor from public.colors where id = p_fill_color_id and available;
    if not found then raise exception 'invalid_fill_color' using errcode = '22023'; end if;
  end if;

  insert into public.orders (
    customer_name, phone, customer_note,
    model_id, model_name, model_image_url,
    body_color_id, body_color_name, body_color_hex,
    fill_type, fill_color_id, fill_color_name, fill_color_hex,
    personal_text
  ) values (
    v_name, v_phone, v_note,
    v_model.id, v_model.name, v_model.image_url,
    v_body.id, v_body.name, v_body.hex,
    v_fill.id, v_fcolor.id, v_fcolor.name, v_fcolor.hex,
    v_text
  )
  returning order_number into v_number;

  return v_number;
end;
$$;

revoke all on function public.create_order(uuid, uuid, text, uuid, text, text, text, text) from public;
grant execute on function public.create_order(uuid, uuid, text, uuid, text, text, text, text) to anon, authenticated;


-- ---------------------------------------------------------------------
-- 5. Row Level Security
-- ---------------------------------------------------------------------
alter table public.models enable row level security;
alter table public.colors enable row level security;
alter table public.fills  enable row level security;
alter table public.orders enable row level security;

-- ---- models -----------------------------------------------------------
drop policy if exists "Public reads active models" on public.models;
create policy "Public reads active models" on public.models
  for select to anon, authenticated using (active);

drop policy if exists "Admin reads all models" on public.models;
create policy "Admin reads all models" on public.models
  for select to authenticated using (public.is_admin());

drop policy if exists "Admin inserts models" on public.models;
create policy "Admin inserts models" on public.models
  for insert to authenticated with check (public.is_admin());

drop policy if exists "Admin updates models" on public.models;
create policy "Admin updates models" on public.models
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admin deletes models" on public.models;
create policy "Admin deletes models" on public.models
  for delete to authenticated using (public.is_admin());

-- ---- colors -----------------------------------------------------------
drop policy if exists "Public reads available colors" on public.colors;
create policy "Public reads available colors" on public.colors
  for select to anon, authenticated using (available);

drop policy if exists "Admin reads all colors" on public.colors;
create policy "Admin reads all colors" on public.colors
  for select to authenticated using (public.is_admin());

drop policy if exists "Admin inserts colors" on public.colors;
create policy "Admin inserts colors" on public.colors
  for insert to authenticated with check (public.is_admin());

drop policy if exists "Admin updates colors" on public.colors;
create policy "Admin updates colors" on public.colors
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admin deletes colors" on public.colors;
create policy "Admin deletes colors" on public.colors
  for delete to authenticated using (public.is_admin());

-- ---- fills ------------------------------------------------------------
drop policy if exists "Public reads available fills" on public.fills;
create policy "Public reads available fills" on public.fills
  for select to anon, authenticated using (available);

drop policy if exists "Admin reads all fills" on public.fills;
create policy "Admin reads all fills" on public.fills
  for select to authenticated using (public.is_admin());

-- Fill types are fixed, so admins can only edit them (no insert / delete).
drop policy if exists "Admin updates fills" on public.fills;
create policy "Admin updates fills" on public.fills
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---- orders -----------------------------------------------------------
-- No policy for anon at all: the public can neither read nor write orders
-- directly. Customers create orders only through create_order().
revoke all on public.orders from anon;
revoke all on public.orders from authenticated;
grant select on public.orders to authenticated;
-- Admins may change only the status and the internal note, nothing the customer entered.
grant update (status, internal_note) on public.orders to authenticated;

drop policy if exists "Admin reads orders" on public.orders;
create policy "Admin reads orders" on public.orders
  for select to authenticated using (public.is_admin());

drop policy if exists "Admin updates orders" on public.orders;
create policy "Admin updates orders" on public.orders
  for update to authenticated using (public.is_admin()) with check (public.is_admin());


-- ---------------------------------------------------------------------
-- 6. Storage: public bucket for model photos
-- Anyone can view the photos (they are shown on the order page);
-- only admins can upload, replace or delete them.
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('model-images', 'model-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Admin uploads model images" on storage.objects;
create policy "Admin uploads model images" on storage.objects
  for insert to authenticated with check (bucket_id = 'model-images' and public.is_admin());

drop policy if exists "Admin updates model images" on storage.objects;
create policy "Admin updates model images" on storage.objects
  for update to authenticated
  using (bucket_id = 'model-images' and public.is_admin())
  with check (bucket_id = 'model-images' and public.is_admin());

drop policy if exists "Admin deletes model images" on storage.objects;
create policy "Admin deletes model images" on storage.objects
  for delete to authenticated using (bucket_id = 'model-images' and public.is_admin());


-- ---------------------------------------------------------------------
-- 7. Starter catalog (inserted only when a table is empty)
-- The 9 current models keep using the photos shipped with the site
-- (/images/mezuzahs/...). Models you add from the panel use Supabase Storage.
-- ---------------------------------------------------------------------
insert into public.models (name, image_url, sort_order, fit, mask_body_url, mask_fill_url)
select v.name, '/images/mezuzahs/' || v.slug || '.jpg', v.sort_order, v.fit::jsonb,
       '/images/mezuzahs/masks/' || v.slug || '-body.png',
       '/images/mezuzahs/masks/' || v.slug || '-fill.png'
from (values
  ('flame-large',        'אש גדול',             10, '{"cx":497,"cy":529,"h":833}'),
  ('flame-small',        'אש קטן',              20, '{"cx":497,"cy":517,"h":870,"tilt":-5.4}'),
  ('flame-side-large',   'אש שלי על הצד גדול',  30, '{"cx":492,"cy":524,"h":931}'),
  ('flame-side-small',   'אש שלי על הצד קטן',   40, '{"cx":503,"cy":520,"h":915,"tilt":-1.8}'),
  ('shin-large',         'ש גדול',              50, '{"cx":498,"cy":526,"h":898}'),
  ('shin-small',         'ש קטן',               60, '{"cx":482,"cy":524,"h":902}'),
  ('shin-smallest',      'ש הכי קטן',           70, '{"cx":497,"cy":525,"h":851}'),
  ('shin-regular-large', 'ש רגילה גדול',        80, '{"cx":492,"cy":527,"h":909}'),
  ('shin-regular-small', 'ש רגילה קטן',         90, '{"cx":503,"cy":523,"h":892}')
) as v(slug, name, sort_order, fit)
where not exists (select 1 from public.models);

insert into public.colors (name, hex, available, sort_order)
select v.name, v.hex, v.available, v.sort_order
from (values
  ('שחור',       '#222222', true,  10),
  ('לבן',        '#F8F6F0', true,  20),
  ('בז׳',        '#D8C7A6', true,  30),
  ('אבן מנוקד',  '#B7A98D', true,  40),
  ('בורדו',      '#7B2634', true,  50),
  ('כחול',       '#315A7D', true,  60),
  ('זהב',        '#C7A24A', false, 70)
) as v(name, hex, available, sort_order)
where not exists (select 1 from public.colors);

insert into public.fills (id, name, description, available, sort_order)
select v.id, v.name, v.description, true, v.sort_order
from (values
  ('none',   'ללא מילוי', 'גוף אחיד וחלק',        10),
  ('single', 'צבע אחד',   'מילוי בצבע לבחירתכם',  20)
) as v(id, name, description, sort_order)
where not exists (select 1 from public.fills);


-- ---------------------------------------------------------------------
-- 8. Done. Manual steps that SQL cannot do for you
--
--   a) Supabase > Authentication > Users > "Add user" > create the admin
--      (email + password, tick "Auto Confirm User").
--   b) Supabase > Authentication > Sign In / Providers > turn OFF
--      "Allow new users to sign up" (nobody else should be able to register).
--   c) Make that user an admin - replace the email and run this one line:
--
--        insert into public.admins (user_id)
--        select id from auth.users where email = 'YOUR-ADMIN-EMAIL@example.com'
--        on conflict do nothing;
--
--   d) Add the two environment variables (see .env.example) locally and in Vercel.
-- ---------------------------------------------------------------------
