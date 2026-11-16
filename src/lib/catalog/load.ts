import { getSupabaseEnv } from "@/lib/supabase/env";
import { createPublicSupabase } from "@/lib/supabase/server";
import type { Catalog, Color, Fill, Model, ModelFit } from "./types";

type ModelRow = {
  id: string;
  name: string;
  image_url: string;
  fit: unknown;
  mask_body_url: string | null;
  mask_fill_url: string | null;
};
type ColorRow = { id: string; name: string; hex: string };
type FillRow = { id: string; name: string; description: string | null };

/** Accepts the jsonb value only when it really looks like a ModelFit. */
export function parseFit(value: unknown): ModelFit | null {
  if (!value || typeof value !== "object") return null;
  const { cx, cy, h, tilt } = value as Record<string, unknown>;
  if (typeof cx !== "number" || typeof cy !== "number" || typeof h !== "number" || h <= 0) return null;
  return { cx, cy, h, ...(typeof tilt === "number" ? { tilt } : {}) };
}

export function mapModel(row: ModelRow): Model {
  return {
    id: row.id,
    name: row.name,
    imageUrl: row.image_url,
    fit: parseFit(row.fit),
    maskBodyUrl: row.mask_body_url,
    maskFillUrl: row.mask_fill_url,
  };
}

export type CatalogResult = { ok: true; catalog: Catalog } | { ok: false };

/** Logs a PostgREST error with everything useful for diagnosis. Never prints keys. */
function logQueryError(table: string, error: { code?: string; message?: string; details?: string | null; hint?: string | null }) {
  console.error(
    `[loadCatalog] ${table} query failed | code=${error.code ?? "-"} | message=${error.message ?? "-"} | details=${error.details ?? "-"} | hint=${error.hint ?? "-"}`,
  );
}

/**
 * Reads the public catalog. Row Level Security only returns active models and
 * available colours / fills, so no extra filtering is needed (it is repeated here
 * anyway as a second line of defence). Never throws: any failure becomes { ok: false }.
 */
export async function loadCatalog(): Promise<CatalogResult> {
  if (!getSupabaseEnv()) {
    // Names only - never values.
    const missing = [
      process.env.NEXT_PUBLIC_SUPABASE_URL ? null : "NEXT_PUBLIC_SUPABASE_URL",
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ? null : "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    ].filter(Boolean);
    console.error(`[loadCatalog] Supabase env vars are missing at runtime: ${missing.join(", ")}`);
    return { ok: false };
  }
  try {
    const supabase = createPublicSupabase();
    const [models, colors, fills] = await Promise.all([
      supabase
        .from("models")
        .select("id, name, image_url, fit, mask_body_url, mask_fill_url")
        .eq("active", true)
        .order("sort_order")
        .order("created_at"),
      supabase.from("colors").select("id, name, hex").eq("available", true).order("sort_order").order("created_at"),
      supabase.from("fills").select("id, name, description").eq("available", true).order("sort_order"),
    ]);
    if (models.error) logQueryError("models", models.error);
    if (colors.error) logQueryError("colors", colors.error);
    if (fills.error) logQueryError("fills", fills.error);
    if (models.error || colors.error || fills.error) return { ok: false };

    const catalog: Catalog = {
      models: (models.data as ModelRow[]).map(mapModel),
      colors: (colors.data as ColorRow[]).map((c): Color => ({ id: c.id, name: c.name, hex: c.hex })),
      fills: (fills.data as FillRow[])
        .filter((f): f is FillRow & { id: Fill["id"] } => f.id === "none" || f.id === "single")
        .map((f): Fill => ({ id: f.id, name: f.name, description: f.description })),
    };
    // Without at least one model, colour and fill nobody can order: treat as unavailable.
    if (!catalog.models.length || !catalog.colors.length || !catalog.fills.length) {
      console.error(
        `[loadCatalog] catalog is empty for the public role (models=${catalog.models.length}, colors=${catalog.colors.length}, fills=${catalog.fills.length}; rows returned: models=${models.data.length}, colors=${colors.data.length}, fills=${fills.data.length})`,
      );
      return { ok: false };
    }
    return { ok: true, catalog };
  } catch (err) {
    console.error("[loadCatalog] unexpected failure while loading the catalog:", err instanceof Error ? err.message : err);
    return { ok: false };
  }
}
