import { connection } from "next/server";
import ModelsManager from "@/components/admin/ModelsManager";
import { MODEL_COLUMNS, type AdminModel } from "@/lib/admin/catalog";
import { createSessionSupabase } from "@/lib/supabase/server";

export default async function AdminModelsPage() {
  await connection();
  const supabase = await createSessionSupabase();
  const { data, error } = await supabase.from("models").select(MODEL_COLUMNS).order("sort_order").order("created_at");
  if (error) {
    console.error(`[adminModels] could not read models | code=${error.code ?? "-"} | message=${error.message ?? "-"}`);
  }
  // 42703 = column does not exist: supabase/prices.sql has not been run yet.
  const needsPricesSql = error?.code === "42703";

  return (
    <div>
      <h1 className="mb-5 text-2xl font-bold">דגמים</h1>
      {needsPricesSql ? (
        <section role="alert" className="rounded-3xl border border-gold bg-[#fbf6ed] p-5">
          <h2 className="mb-2 text-lg font-bold">צריך להפעיל את המחירים במסד הנתונים</h2>
          <p className="text-brown-soft">
            יש להריץ פעם אחת את הקובץ <code dir="ltr">supabase/prices.sql</code> ב-Supabase (SQL Editor) ואז לרענן את הדף.
          </p>
        </section>
      ) : error ? (
        <p role="alert" className="rounded-2xl border border-line bg-white p-6 text-center text-error">
          לא הצלחנו לטעון את הנתונים. רעננו את הדף ונסו שוב.
        </p>
      ) : (
        <ModelsManager models={(data ?? []) as unknown as AdminModel[]} />
      )}
    </div>
  );
}
