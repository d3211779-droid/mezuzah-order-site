import { Suspense } from "react";
import CatalogSection, { CatalogLoading } from "@/components/CatalogSection";
import Header from "@/components/Header";
import SiteBar from "@/components/SiteBar";

export default function Home() {
  return (
    <main className="min-h-screen bg-cream text-brown">
      <SiteBar />
      <div className="mx-auto max-w-6xl">
        <Header />
        {/* The catalog is read from Supabase per request, so it streams in behind Suspense. */}
        <Suspense fallback={<CatalogLoading />}>
          <CatalogSection />
        </Suspense>
      </div>
    </main>
  );
}
