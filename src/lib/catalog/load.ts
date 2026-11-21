import { getSupabaseEnv } from "@/lib/supabase/env";
import { createPublicSupabase } from "@/lib/supabase/server";
import { asPriceAgorot } from "@/lib/money";
import { DEFAULT_SETTINGS, SETTING_COLUMNS, parseSettings, type SiteSettings } from "@/lib/settings";
import type { Catalog, Color, Fill, Model, ModelFit, Parchment } from "./types";

type ModelRow = {
  id: string;
  name: string;
  image_url: string;
  fit: unknown;
  mask_body_url: string | null;
  mask_fill_url: string | null;
  /** Whole agorot, or null/absent = price not set yet. */
  price_agorot?: number | null;
};
type ColorRow = { id: string; name: string; hex: string };
type FillRow = { id: string; name: string; description: string | null };
type ParchmentRow = {
  id: string;
  name: string;
  description: string | null;
  note: string | null;
  size_cm: number;
  price_agorot: number | null;
};

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
    priceAgorot: asPriceAgorot(row.price_agorot),
  };
}

const MODEL_COLUMNS_BASE = "id, name, image_url, fit, mask_body_url, mask_fill_url";

/**
 * Reads the active models with their price. If the price column does not exist yet (the SQL of
 * supabase/prices.sql was not run), the models are read without it and simply have no price, so
 * the catalog itself never fails because of it.
 */
async function loadModels(supabase: ReturnType<typeof createPublicSupabase>) {
  const read = (columns: string) =>
    supabase.from("models").select(columns).eq("active", true).order("sort_order").order("created_at");
  const withPrice = await read(`${MODEL_COLUMNS_BASE}, price_agorot`);
  if (withPrice.error?.code === "42703") {
    console.warn("[loadCatalog] models.price_agorot does not exist yet - run supabase/prices.sql. All models are treated as having no price.");
    return read(MODEL_COLUMNS_BASE);
  }
  return withPrice;
}

/**
 * Reads the single `site_settings` row. It can never break the catalog: if the table does not
 * exist yet, the row is missing or the request fails, the built-in defaults are used.
 */
async function loadSettings(supabase: ReturnType<typeof createPublicSupabase>): Promise<SiteSettings> {
  try {
    const { data, error } = await supabase.from("site_settings").select(SETTING_COLUMNS).eq("id", true).maybeSingle();
    if (error) {
      console.warn(
        `[loadCatalog] site_settings unavailable, using defaults | code=${error.code ?? "-"} | message=${error.message ?? "-"}`,
      );
      return DEFAULT_SETTINGS;
    }
    return parseSettings(data);
  } catch (err) {
    console.warn("[loadCatalog] site_settings failed, using defaults:", err instanceof Error ? err.message : err);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Reads the available parchments that have a price. Like the settings, this can never break the
 * catalog: if the table does not exist yet (supabase/parchments.sql not run) or the request fails,
 * there are simply no parchments and the customer does not see the option at all.
 */
async function loadParchments(supabase: ReturnType<typeof createPublicSupabase>): Promise<Parchment[]> {
  try {
    const { data, error } = await supabase
      .from("parchments")
      .select("id, name, description, note, size_cm, price_agorot")
      .eq("available", true)
      .order("sort_order")
      .order("created_at");
    if (error) {
      console.warn(
        `[loadCatalog] parchments unavailable, the parchment option is hidden | code=${error.code ?? "-"} | message=${error.message ?? "-"}`,
      );
      return [];
    }
    return (data as unknown as ParchmentRow[]).flatMap((row): Parchment[] => {
      const price = asPriceAgorot(row.price_agorot);
      if (price === null || !Number.isInteger(row.size_cm)) return [];
      return [{ id: row.id, name: row.name, description: row.description, note: row.note, sizeCm: row.size_cm, priceAgorot: price }];
    });
  } catch (err) {
    console.warn("[loadCatalog] parchments failed, the parchment option is hidden:", err instanceof Error ? err.message : err);
    return [];
  }
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
    const [models, colors, fills, settings, parchments] = await Promise.all([
      loadModels(supabase),
      supabase.from("colors").select("id, name, hex").eq("available", true).order("sort_order").order("created_at"),
      supabase.from("fills").select("id, name, description").eq("available", true).order("sort_order"),
      loadSettings(supabase),
      loadParchments(supabase),
    ]);
    if (models.error) logQueryError("models", models.error);
    if (colors.error) logQueryError("colors", colors.error);
    if (fills.error) logQueryError("fills", fills.error);
    if (models.error || colors.error || fills.error) return { ok: false };

    const catalog: Catalog = {
      models: (models.data as unknown as ModelRow[]).map(mapModel),
      colors: (colors.data as ColorRow[]).map((c): Color => ({ id: c.id, name: c.name, hex: c.hex })),
      fills: (fills.data as FillRow[])
        .filter((f): f is FillRow & { id: Fill["id"] } => f.id === "none" || f.id === "single")
        .map((f): Fill => ({ id: f.id, name: f.name, description: f.description })),
      parchments,
      settings,
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
