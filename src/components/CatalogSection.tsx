import type { ReactNode } from "react";
import { connection } from "next/server";
import { CatalogProvider } from "@/lib/catalog/context";
import { loadCatalog } from "@/lib/catalog/load";
import OrderBuilder from "./OrderBuilder";
import RetryButton from "./RetryButton";

/**
 * Loads the catalog from Supabase on every request and gives it to its children.
 * Used by the order screen, the cart and the checkout (all of them need live prices).
 */
export async function CatalogGate({ children }: { children: ReactNode }) {
  // Always render at request time. Without this, a build where Supabase was unreachable or its env vars
  // were missing would bake the "catalog unavailable" message into the static page for every visitor.
  await connection();
  const result = await loadCatalog();
  if (!result.ok) return <CatalogUnavailable />;

  return <CatalogProvider catalog={result.catalog}>{children}</CatalogProvider>;
}

/** The order screen with the live catalog. */
export default function CatalogSection() {
  return (
    <CatalogGate>
      <OrderBuilder />
    </CatalogGate>
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
