import type { Metadata } from "next";
import { Suspense } from "react";
import Landing, { LandingLoading } from "@/components/landing/Landing";
import SiteBar from "@/components/SiteBar";

export const metadata: Metadata = {
  title: "מזוזות מעוצבות בהתאמה אישית",
  description: "מזוזות מודפסות בתלת־ממד, בעיצובים מיוחדים ובמגוון צבעים, עם אפשרות לכיתוב אישי.",
};

export default function Home() {
  return (
    <main className="min-h-screen bg-cream text-brown">
      <SiteBar />
      {/* Prices and availability come from Supabase per request, so the page streams in behind Suspense. */}
      <Suspense fallback={<LandingLoading />}>
        <Landing />
      </Suspense>
    </main>
  );
}
