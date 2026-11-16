-- =====================================================================
-- Mezuzah order site - site settings (stage 3)
-- Copy this whole file into Supabase > SQL Editor and press "Run".
-- Run it AFTER schema.sql. It is safe to run more than once (idempotent):
-- existing values are never overwritten.
--
-- What it creates
--   site_settings   ONE row with the texts / limits the admin panel edits:
--                   personal text limit, print-area note, confirmation message,
--                   "closed back" note and the "good to know" card.
--   RLS             everyone may READ the row (these are public texts);
--                   only an admin may UPDATE it; nobody can insert or delete.
--
-- It does NOT touch create_order(), orders, the catalog tables or any
-- existing policy. The personal text stays capped at 30 characters in the
-- database; the limit chosen here (1-30) is enforced by the website form.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 0. Helper used by the updated_at trigger (same definition as schema.sql)
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
-- 1. The table: one row, one typed column per setting
--    * required texts must not be empty
--    * optional texts may be empty - an empty value hides that part of the site
-- ---------------------------------------------------------------------
create table if not exists public.site_settings (
  -- "id boolean primary key check (id)" allows exactly one row (id = true).
  id                      boolean primary key default true check (id),

  personal_text_max       integer not null default 8
                            check (personal_text_max between 1 and 30),
  personal_text_size_note text not null default 'הכיתוב מותאם לשטח הדפסה ברוחב כ־2.5 ס״מ'
                            check (char_length(btrim(personal_text_size_note)) between 1 and 200),

  confirmation_message    text not null default 'ניצור איתך קשר בטלפון לסגירת התשלום והאספקה.'
                            check (char_length(btrim(confirmation_message)) between 1 and 400),

  -- optional: empty title = the whole "closed back" note is hidden
  closed_back_title       text not null default 'המזוזה סגורה מאחור'
                            check (char_length(btrim(closed_back_title)) <= 80),
  closed_back_text        text not null default 'למראה נקי ולשמירה על הקלף'
                            check (char_length(btrim(closed_back_text)) <= 200),

  -- optional: empty = the "good to know" card is hidden
  usage_note              text not null default 'המזוזות מיועדות בעיקר להתקנה בתוך הבית או בכניסה מקורה ומוגנת. בכניסה חיצונית החשופה ישירות לשמש ולגשם מומלץ להתייעץ איתנו לפני ההזמנה.'
                            check (char_length(btrim(usage_note)) <= 500),

  updated_at              timestamptz not null default now()
);

drop trigger if exists site_settings_set_updated_at on public.site_settings;
create trigger site_settings_set_updated_at before update on public.site_settings
  for each row execute function public.set_updated_at();


-- ---------------------------------------------------------------------
-- 2. The one row (created once, never overwritten)
-- ---------------------------------------------------------------------
insert into public.site_settings (id) values (true)
on conflict (id) do nothing;


-- ---------------------------------------------------------------------
-- 3. Row Level Security
--    There are deliberately NO insert / delete policies.
-- ---------------------------------------------------------------------
alter table public.site_settings enable row level security;

drop policy if exists "Public reads site settings" on public.site_settings;
create policy "Public reads site settings" on public.site_settings
  for select to anon, authenticated using (true);

drop policy if exists "Admin updates site settings" on public.site_settings;
create policy "Admin updates site settings" on public.site_settings
  for update to authenticated using (public.is_admin()) with check (public.is_admin());


-- ---------------------------------------------------------------------
-- 4. Explicit grants (new Supabase projects do not expose tables automatically)
--    Start from nothing, then allow exactly: read for everyone, and update of
--    the setting columns for signed-in users (RLS then limits it to admins).
-- ---------------------------------------------------------------------
revoke all on public.site_settings from anon, authenticated;
grant select on public.site_settings to anon, authenticated;
grant update (
  personal_text_max,
  personal_text_size_note,
  confirmation_message,
  closed_back_title,
  closed_back_text,
  usage_note
) on public.site_settings to authenticated;


-- ---------------------------------------------------------------------
-- 5. Done. Check: Table Editor > site_settings shows ONE row with the
--    default values, and /admin/settings in the site can now save changes.
-- ---------------------------------------------------------------------
