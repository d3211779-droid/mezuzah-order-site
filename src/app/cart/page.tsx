import type { Metadata } from "next";
import { Suspense } from "react";
import { CatalogGate, CatalogLoading } from "@/components/CatalogSection";
import CartView from "@/components/CartView";
import SiteBar from "@/components/SiteBar";

export const metadata: Metadata = {
  title: "סל הקניות",
  robots: { index: false, follow: false },
};

export default function CartPage() {
  return (
    <main className="min-h-screen bg-cream text-brown">
      <SiteBar />
      <div className="mx-auto max-w-6xl px-4 py-6">
        <h1 className="mb-5 text-3xl font-bold">סל הקניות</h1>
        {/* Live prices come from Supabase per request, so this streams in behind Suspense. */}
        <Suspense fallback={<CatalogLoading />}>
          <CatalogGate>
            <CartView />
          </CatalogGate>
        </Suspense>
      </div>
    </main>
  );
}
