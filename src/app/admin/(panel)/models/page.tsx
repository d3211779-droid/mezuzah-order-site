import { connection } from "next/server";
import ModelsManager from "@/components/admin/ModelsManager";
import { MODEL_COLUMNS, type AdminModel } from "@/lib/admin/catalog";
import { createSessionSupabase } from "@/lib/supabase/server";

export default async function AdminModelsManagerPage() {
  await connection();
  const supabase = await createSessionSupabase();
  const { data, error } = await supabase.from("models").select(MODEL_COLUMNS).order("sort_order").order("created_at");

  return (
    <div>
      <h1 className="mb-5 text-2xl font-bold">דגמים</h1>
      {error ? (
        <p role="alert" className="rounded-2xl border border-line bg-white p-6 text-center text-error">
          לא הצלחנו לטעון את הנתונים. רעננו את הדף ונסו שוב.
        </p>
      ) : (
        <ModelsManager models={(data ?? []) as AdminModel[]} />
      )}
    </div>
  );
}
