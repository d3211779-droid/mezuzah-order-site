import { connection } from "next/server";
import ColorsManager from "@/components/admin/ColorsManager";
import { COLOR_COLUMNS, type AdminColor } from "@/lib/admin/catalog";
import { createSessionSupabase } from "@/lib/supabase/server";

export default async function AdminColorsManagerPage() {
  await connection();
  const supabase = await createSessionSupabase();
  const { data, error } = await supabase.from("colors").select(COLOR_COLUMNS).order("sort_order").order("created_at");

  return (
    <div>
      <h1 className="mb-5 text-2xl font-bold">צבעים</h1>
      {error ? (
        <p role="alert" className="rounded-2xl border border-line bg-white p-6 text-center text-error">
          לא הצלחנו לטעון את הנתונים. רעננו את הדף ונסו שוב.
        </p>
      ) : (
        <ColorsManager colors={(data ?? []) as AdminColor[]} />
      )}
    </div>
  );
}
