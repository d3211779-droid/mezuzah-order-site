import { connection } from "next/server";
import ParchmentsManager from "@/components/admin/ParchmentsManager";
import { PARCHMENT_COLUMNS, type AdminParchment } from "@/lib/admin/catalog";
import { createSessionSupabase } from "@/lib/supabase/server";

// Postgres "relation does not exist" / PostgREST "table not in schema cache" / permission denied
const TABLE_MISSING = new Set(["42P01", "PGRST205", "42501"]);

export default async function AdminParchmentsPage() {
  await connection();
  const supabase = await createSessionSupabase();
  const { data, error } = await supabase.from("parchments").select(PARCHMENT_COLUMNS).order("sort_order").order("created_at");

  return (
    <div>
      <h1 className="mb-5 text-2xl font-bold">קלפים</h1>
      {error && TABLE_MISSING.has(error.code ?? "") ? (
        <section role="alert" className="rounded-3xl border border-gold bg-[#fbf6ed] p-5">
          <h2 className="mb-2 text-lg font-bold">צריך להריץ את קובץ ה-SQL של הקלפים</h2>
          <p className="text-brown-soft">
            טבלת הקלפים עדיין לא קיימת ב-Supabase. יש להריץ פעם אחת את הקובץ <code dir="ltr">supabase/parchments.sql</code> (SQL Editor) ואז
            לרענן את הדף.
          </p>
        </section>
      ) : error ? (
        <p role="alert" className="rounded-2xl border border-line bg-white p-6 text-center text-error">
          לא הצלחנו לטעון את הנתונים. רעננו את הדף ונסו שוב.
        </p>
      ) : (
        <ParchmentsManager parchments={(data ?? []) as unknown as AdminParchment[]} />
      )}
    </div>
  );
}
