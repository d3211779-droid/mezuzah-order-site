import Link from "next/link";
import { connection } from "next/server";
import ColorsManager from "@/components/admin/ColorsManager";
import FillsManager from "@/components/admin/FillsManager";
import ModelsManager from "@/components/admin/ModelsManager";
import {
  CATALOG_TABS,
  COLOR_COLUMNS,
  FILL_COLUMNS,
  MODEL_COLUMNS,
  isCatalogTab,
  type AdminColor,
  type AdminFill,
  type AdminModel,
} from "@/lib/admin/catalog";
import { createSessionSupabase } from "@/lib/supabase/server";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function AdminCatalogPage({ searchParams }: { searchParams: SearchParams }) {
  await connection();
  const sp = await searchParams;
  const raw = Array.isArray(sp.tab) ? sp.tab[0] : sp.tab;
  const tab = raw && isCatalogTab(raw) ? raw : "models";

  const supabase = await createSessionSupabase();
  let content: React.ReactNode;
  let failed = false;

  if (tab === "models") {
    const { data, error } = await supabase.from("models").select(MODEL_COLUMNS).order("sort_order").order("created_at");
    failed = !!error;
    content = <ModelsManager models={(data ?? []) as AdminModel[]} />;
  } else if (tab === "colors") {
    const { data, error } = await supabase.from("colors").select(COLOR_COLUMNS).order("sort_order").order("created_at");
    failed = !!error;
    content = <ColorsManager colors={(data ?? []) as AdminColor[]} />;
  } else {
    const { data, error } = await supabase.from("fills").select(FILL_COLUMNS).order("sort_order");
    failed = !!error;
    content = <FillsManager fills={(data ?? []) as AdminFill[]} />;
  }

  return (
    <div>
      <h1 className="mb-5 text-2xl font-bold">קטלוג</h1>

      <nav aria-label="חלקי הקטלוג" className="-mx-1 mb-5 flex gap-2 overflow-x-auto px-1 pb-1">
        {CATALOG_TABS.map((t) => (
          <Link
            key={t.id}
            href={`/admin/catalog?tab=${t.id}`}
            aria-current={t.id === tab ? "page" : undefined}
            className={`flex min-h-11 shrink-0 items-center rounded-full border px-6 font-semibold ${
              t.id === tab ? "border-brown bg-brown text-white" : "border-line bg-white hover:border-gold"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      {failed ? (
        <p role="alert" className="rounded-2xl border border-line bg-white p-6 text-center text-error">
          לא הצלחנו לטעון את הנתונים. רעננו את הדף ונסו שוב.
        </p>
      ) : (
        content
      )}
    </div>
  );
}
