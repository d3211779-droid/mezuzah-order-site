import { connection } from "next/server";
import FillsManager from "@/components/admin/FillsManager";
import { FILL_COLUMNS, type AdminFill } from "@/lib/admin/catalog";
import { createSessionSupabase } from "@/lib/supabase/server";

export default async function AdminFillsManagerPage() {
  await connection();
  const supabase = await createSessionSupabase();
  const { data, error } = await supabase.from("fills").select(FILL_COLUMNS).order("sort_order");

  return (
    <div>
      <h1 className="mb-5 text-2xl font-bold">מילויים</h1>
      {error ? (
        <p role="alert" className="rounded-2xl border border-line bg-white p-6 text-center text-error">
          לא הצלחנו לטעון את הנתונים. רעננו את הדף ונסו שוב.
        </p>
      ) : (
        <FillsManager fills={(data ?? []) as AdminFill[]} />
      )}
    </div>
  );
}
