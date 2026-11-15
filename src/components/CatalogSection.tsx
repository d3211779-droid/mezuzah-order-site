import { CatalogProvider } from "@/lib/catalog/context";
import { loadCatalog } from "@/lib/catalog/load";
import OrderBuilder from "./OrderBuilder";
import RetryButton from "./RetryButton";

/** Loads the catalog from Supabase on every request and renders the order screen with it. */
export default async function CatalogSection() {
  const result = await loadCatalog();
  if (!result.ok) return <CatalogUnavailable />;

  return (
    <CatalogProvider catalog={result.catalog}>
      <OrderBuilder />
    </CatalogProvider>
  );
}

/** Friendly fallback when the database cannot be reached - the page itself never crashes. */
function CatalogUnavailable() {
  return (
    <section role="alert" className="mx-auto max-w-xl px-4 pb-16 text-center">
      <div className="rounded-3xl border border-line bg-white p-8 shadow-sm">
        <h2 className="text-xl font-bold">לא הצלחנו לטעון את הקטלוג כרגע</h2>
        <p className="mt-2 text-brown-soft">זו תקלה זמנית. נסו לרענן את הדף בעוד רגע.</p>
        <RetryButton />
      </div>
    </section>
  );
}

export function CatalogLoading() {
  return (
    <p role="status" className="px-4 pb-16 text-center text-brown-soft">
      טוען את הקטלוג…
    </p>
  );
}
