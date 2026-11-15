"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { Catalog, Color, Fill, Model } from "./types";

type CatalogApi = Catalog & {
  getModel: (id: string | null) => Model | null;
  getColor: (id: string | null) => Color | null;
  getFill: (id: string | null) => Fill | null;
};

const CatalogContext = createContext<CatalogApi | null>(null);

/** Gives every component of the order screen the catalog that was loaded from Supabase. */
export function CatalogProvider({ catalog, children }: { catalog: Catalog; children: ReactNode }) {
  const value = useMemo<CatalogApi>(
    () => ({
      ...catalog,
      getModel: (id) => catalog.models.find((m) => m.id === id) ?? null,
      getColor: (id) => catalog.colors.find((c) => c.id === id) ?? null,
      getFill: (id) => catalog.fills.find((f) => f.id === id) ?? null,
    }),
    [catalog],
  );
  return <CatalogContext value={value}>{children}</CatalogContext>;
}

export function useCatalog(): CatalogApi {
  const ctx = useContext(CatalogContext);
  if (!ctx) throw new Error("useCatalog must be used inside <CatalogProvider>");
  return ctx;
}
