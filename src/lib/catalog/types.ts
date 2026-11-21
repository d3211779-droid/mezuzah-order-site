import type { SiteSettings } from "@/lib/settings";

/**
 * Where the mezuzah sits inside its 1024x1024 source photo, measured once per image.
 * The gallery uses it to give every model the same size, centre and (when needed) a
 * small straightening rotation, with CSS only - the image files are never edited.
 */
export type ModelFit = {
  /** Centre of the mezuzah, in source pixels. */
  cx: number;
  cy: number;
  /** Visible height of the mezuzah, in source pixels. */
  h: number;
  /** Straightening rotation in degrees (negative = counter-clockwise). */
  tilt?: number;
};

/** A model as the customer page needs it (mapped from the `models` table). */
export type Model = {
  id: string;
  name: string;
  imageUrl: string;
  /** Optional: models added from the admin panel have no fit/masks yet. */
  fit: ModelFit | null;
  /** Alpha masks for the live colour preview (silhouette / engraved design area). */
  maskBodyUrl: string | null;
  maskFillUrl: string | null;
  /** Base price in whole agorot (4990 = 49.90 ILS, VAT included). null = not set: the model cannot be ordered. */
  priceAgorot: number | null;
};

export type Color = {
  id: string;
  name: string;
  hex: string;
};

export type FillId = "none" | "single";

export type Fill = {
  id: FillId;
  name: string;
  description: string | null;
};

/**
 * An optional add-on sold together with a mezuzah (managed in the admin panel, table `parchments`).
 * The catalog only contains parchments that are available AND have a price.
 */
export type Parchment = {
  id: string;
  /** Shown to customers exactly as the admin typed it. */
  name: string;
  description: string | null;
  note: string | null;
  sizeCm: number;
  /** Surcharge per mezuzah in whole agorot (VAT included). */
  priceAgorot: number;
};

export type Catalog = {
  models: Model[];
  colors: Color[];
  fills: Fill[];
  /** Empty = the parchment option is not offered at all. */
  parchments: Parchment[];
  /** Texts and limits from the admin panel (never missing: falls back to the defaults). */
  settings: SiteSettings;
};
