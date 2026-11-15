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

export type Catalog = {
  models: Model[];
  colors: Color[];
  fills: Fill[];
};
