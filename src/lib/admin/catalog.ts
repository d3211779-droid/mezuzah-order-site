/** Rows of the catalog tables exactly as the admin panel reads them (all rows, not only public ones). */
export type AdminModel = {
  id: string;
  name: string;
  image_url: string;
  active: boolean;
  sort_order: number;
  mask_body_url: string | null;
  /** Whole agorot, or null = no price yet (the model cannot be ordered). */
  price_agorot: number | null;
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
  description: string | null;
  available: boolean;
  sort_order: number;
};

/** A parchment add-on exactly as the admin reads it (all rows, available or not). */
export type AdminParchment = {
  id: string;
  name: string;
  description: string | null;
  note: string | null;
  size_cm: number;
  /** Whole agorot, or null = no price yet (it cannot be switched on). */
  price_agorot: number | null;
  available: boolean;
  sort_order: number;
};

export const PARCHMENT_COLUMNS = "id, name, description, note, size_cm, price_agorot, available, sort_order";

export const MODEL_COLUMNS = "id, name, image_url, active, sort_order, mask_body_url, price_agorot";
export const COLOR_COLUMNS = "id, name, hex, available, sort_order";
export const FILL_COLUMNS = "id, name, description, available, sort_order";

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

/** An optional typed display position: a whole number from 1 to 100000, otherwise null. */
export function parseSortOrder(value: unknown): number | null {
  return typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 100000 ? value : null;
}

/** A whole number of centimetres from 1 to 100, otherwise null. */
export function parseSizeCm(value: unknown): number | null {
  return typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 100 ? value : null;
}

/** Optional free text: trimmed, empty becomes null. `undefined` = not acceptable (not a string or too long). */
export function cleanOptionalText(value: unknown, max: number): string | null | undefined {
  if (value === null || value === undefined) return null;
  if (typeof value !== "string") return undefined;
  const text = value.trim();
  if (text.length > max) return undefined;
  return text === "" ? null : text;
}

export type ActionResult = { ok: true } | { ok: false; error: string };
