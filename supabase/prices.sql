-- =====================================================================
-- Mezuzah order site - model prices (stage A)
-- Copy this whole file into Supabase > SQL Editor and press "Run".
-- Run it AFTER schema.sql. It is safe to run more than once (idempotent):
-- prices that were already entered are never overwritten.
--
-- What it does
--   * adds models.price_agorot - the base price of a model, in AGOROT
--     (whole number: 4990 = 49.90 shekels, 15000 = 150 shekels). Whole
--     numbers keep every later calculation exact (no rounding errors).
--   * NULL means "price not set yet": the website shows
--     "המחיר יעודכן בקרוב" and the model cannot be ordered.
--   * makes sure signed-in users hold the table privileges the admin panel
--     needs (the existing row policies still decide that ONLY admins can
--     insert / update / delete).
--
-- It does NOT touch orders, create_order() or any existing policy.
-- Prices are edited in the admin panel: /admin/models.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. The price column (NULL = not set)
-- ---------------------------------------------------------------------
alter table public.models
  add column if not exists price_agorot integer;

-- a set price is between 0.01 and 10,000.00 shekels
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'models_price_agorot_range' and conrelid = 'public.models'::regclass
  ) then
    alter table public.models
      add constraint models_price_agorot_range
      check (price_agorot is null or price_agorot between 1 and 1000000);
  end if;
end
$$;


-- ---------------------------------------------------------------------
-- 2. Privileges (new Supabase projects do not grant them automatically)
--    RLS is unchanged: everyone reads active models; only admins write.
-- ---------------------------------------------------------------------
grant select on public.models to anon, authenticated;
grant insert, update, delete on public.models to authenticated;


-- ---------------------------------------------------------------------
-- 3. Let the API see the new column right away
-- ---------------------------------------------------------------------
notify pgrst, 'reload schema';


-- ---------------------------------------------------------------------
-- 4. OPTIONAL - enter the prices from here instead of the admin panel.
--    Replace each <מחיר באגורות> with a whole number of agorot
--    (49.90 shekels = 4990), remove the leading "--", and run. Or skip this
--    and type the prices in /admin/models.
-- ---------------------------------------------------------------------
-- update public.models set price_agorot = <מחיר באגורות> where name = 'אש גדול';
-- update public.models set price_agorot = <מחיר באגורות> where name = 'אש קטן';
-- update public.models set price_agorot = <מחיר באגורות> where name = 'אש שלי על הצד גדול';
-- update public.models set price_agorot = <מחיר באגורות> where name = 'אש שלי על הצד קטן';
-- update public.models set price_agorot = <מחיר באגורות> where name = 'ש גדול';
-- update public.models set price_agorot = <מחיר באגורות> where name = 'ש קטן';
-- update public.models set price_agorot = <מחיר באגורות> where name = 'ש הכי קטן';
-- update public.models set price_agorot = <מחיר באגורות> where name = 'ש רגילה גדול';
-- update public.models set price_agorot = <מחיר באגורות> where name = 'ש רגילה קטן';


-- ---------------------------------------------------------------------
-- 5. Check: Table Editor > models now has a price_agorot column (empty).
-- ---------------------------------------------------------------------
