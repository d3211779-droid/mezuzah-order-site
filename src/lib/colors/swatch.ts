import type { CSSProperties } from "react";

/**
 * Display-only textures for colour swatches.
 *
 * The database keeps a plain hex for every colour. A texture is just how that colour is *drawn* in
 * the UI, so it lives here in code, keyed by the colour's name - no schema change.
 */
export type ColorTexture = "stone-speckled";

const TEXTURE_BY_NAME: Record<string, ColorTexture> = {
  "אבן מנוקדת": "stone-speckled",
};

export function textureForColor(name: string | null | undefined): ColorTexture | null {
  return (name ? TEXTURE_BY_NAME[name.trim()] : undefined) ?? null;
}

const SPECKLE = "#2B2B2B";

/** "sm" is for the small dots next to a label: a tighter grid so a few speckles are still visible. */
export type SwatchSize = "sm" | "lg";

/** Inline style for a swatch: the plain hex, plus the speckle pattern for textured colours. */
export function swatchStyle(
  hex: string,
  name?: string | null,
  size: SwatchSize = "lg",
  texture: ColorTexture | null = textureForColor(name),
): CSSProperties {
  if (texture === "stone-speckled") {
    const grid = size === "sm" ? 5 : 8;
    const dot = size === "sm" ? "0.6px" : "1px";
    return {
      backgroundColor: hex,
      backgroundImage: `radial-gradient(${SPECKLE} ${dot}, transparent ${dot}), radial-gradient(${SPECKLE} ${dot}, transparent ${dot})`,
      backgroundSize: `${grid}px ${grid}px`,
      backgroundPosition: `0 0, ${grid / 2}px ${grid / 2}px`,
    };
  }
  return { backgroundColor: hex };
}
