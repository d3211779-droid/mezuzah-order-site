import type { Metadata } from "next";
import { Suspense } from "react";
import { CatalogGate, CatalogLoading } from "@/components/CatalogSection";
import CheckoutView from "@/components/CheckoutView";
import SiteBar from "@/components/SiteBar";

export const metadata: Metadata = {
  title: "פרטי הזמנה",
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return (
    <main className="min-h-screen bg-cream text-brown">
      <SiteBar />
      <div className="mx-auto max-w-6xl px-4 py-6">
        <h1 className="mb-5 text-3xl font-bold">פרטי הזמנה</h1>
        <Suspense fallback={<CatalogLoading />}>
          <CatalogGate>
            <CheckoutView />
          </CatalogGate>
        </Suspense>
      </div>
    </main>
  );
}
