import type { Metadata } from "next";
import { Suspense } from "react";
import CatalogSection, { CatalogLoading } from "@/components/CatalogSection";
import Header from "@/components/Header";
import SiteBar from "@/components/SiteBar";

export const metadata: Metadata = {
  title: "עיצוב המזוזה שלי",
  description: "בחרו דגם, צבע, מילוי וכיתוב אישי והוסיפו את המזוזה לסל.",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/** `/design?model=<id>` (the "לבחירת הדגם" buttons on the home page) starts with that model selected. */
async function Builder({ searchParams }: { searchParams: SearchParams }) {
  const { model } = await searchParams;
  return <CatalogSection initialModelId={typeof model === "string" ? model : null} />;
}

export default function DesignPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <main className="min-h-screen bg-cream text-brown">
      <SiteBar />
      <div className="mx-auto max-w-6xl">
        <Header />
        {/* The catalog is read from Supabase per request, so it streams in behind Suspense. */}
        <Suspense fallback={<CatalogLoading />}>
          <Builder searchParams={searchParams} />
        </Suspense>
      </div>
    </main>
  );
}
