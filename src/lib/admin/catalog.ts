/** Rows of the catalog tables exactly as the admin panel reads them (all rows, not only public ones). */
export type AdminModel = {
  id: string;
  name: string;
  image_url: string;
  active: boolean;
  sort_order: number;
  mask_body_url: string | null;
};

export type AdminColor = {
  id: string;
  name: string;
  hex: string;
  available: boolean;
  sort_order: number;
};

export type AdminFill = {
  id: "none" | "single";
  name: string;
  available: boolean;
  sort_order: number;
};

export const MODEL_COLUMNS = "id, name, image_url, active, sort_order, mask_body_url";
export const COLOR_COLUMNS = "id, name, hex, available, sort_order";
export const FILL_COLUMNS = "id, name, available, sort_order";

export const CATALOG_TABS = [
  { id: "models", label: "דגמים" },
  { id: "colors", label: "צבעים" },
  { id: "fills", label: "מילויים" },
] as const;
export type CatalogTab = (typeof CATALOG_TABS)[number]["id"];

export const isCatalogTab = (v: string): v is CatalogTab => CATALOG_TABS.some((t) => t.id === v);

export const HEX_RE = /^#[0-9A-Fa-f]{6}$/;

/** Trimmed, 1..max characters - or null when the input is not acceptable. */
export function cleanName(value: unknown, max = 80): string | null {
  if (typeof value !== "string") return null;
  const name = value.trim();
  return name.length >= 1 && name.length <= max ? name : null;
}

export type ActionResult = { ok: true } | { ok: false; error: string };
