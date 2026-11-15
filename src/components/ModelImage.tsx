"use client";

import Image from "next/image";
import { useState, type CSSProperties } from "react";
import { maskUrl, type MezuzahModel } from "@/data/catalog";

/** Share of the box height the mezuzah itself should fill, the same for every model. */
const TARGET_HEIGHT = 0.8;

/** Softens the hard edge of the square source photo so it blends into the box. */
const FEATHER =
  "linear-gradient(to right, transparent, #000 5%, #000 95%, transparent), linear-gradient(to bottom, transparent, #000 5%, #000 95%, transparent)";

/** CSS-only normalisation: same size, same centre, straightened if the photo leans. */
function fitStyle({ cx, cy, h, tilt = 0 }: MezuzahModel["fit"]): CSSProperties {
  const scale = (TARGET_HEIGHT * 1024) / h;
  const x = ((512 - cx) / 1024) * scale * 100;
  const y = ((512 - cy) / 1024) * scale * 100;
  return {
    transform: `translate(${x}%, ${y}%) scale(${scale}) rotate(${tilt}deg)`,
    maskImage: FEATHER,
    maskComposite: "intersect",
    WebkitMaskImage: FEATHER,
    WebkitMaskComposite: "source-in",
  };
}

/** Live colours for the preview. Both come from the catalog's hex values. */
export type Tint = { bodyHex: string | null; fillHex: string | null };

function isDark(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return (((n >> 16) & 255) * 299 + ((n >> 8) & 255) * 587 + (n & 255) * 114) / 1000 < 45;
}

/** Positions a layer exactly over the (object-contain) photo and cuts it with an alpha mask. */
function masked(url: string): CSSProperties {
  return {
    maskImage: `url(${url})`,
    maskSize: "contain",
    maskRepeat: "no-repeat",
    maskPosition: "center",
    WebkitMaskImage: `url(${url})`,
    WebkitMaskSize: "contain",
    WebkitMaskRepeat: "no-repeat",
    WebkitMaskPosition: "center",
  };
}

const photoLayer = (src: string): CSSProperties => ({
  backgroundImage: `url(${src})`,
  backgroundSize: "contain",
  backgroundRepeat: "no-repeat",
  backgroundPosition: "center",
});

/**
 * Layered colour preview on top of the untouched photo:
 *  1. body colour, multiplied into the mezuzah silhouette only (keeps all shading),
 *  2. for dark colours, the photo's shading is blended back so details do not vanish,
 *  3. fill colour inside the engraved design only, with the photo's shading multiplied on top.
 */
function TintLayers({ model, tint }: { model: MezuzahModel; tint: Tint }) {
  const body = maskUrl(model.id, "body");
  const fill = maskUrl(model.id, "fill");
  return (
    <>
      {tint.bodyHex && (
        <>
          <span
            aria-hidden="true"
            className="absolute inset-0"
            style={{ ...masked(body), backgroundColor: tint.bodyHex, mixBlendMode: "multiply" }}
          />
          {isDark(tint.bodyHex) && (
            <span
              aria-hidden="true"
              className="absolute inset-0"
              style={{ ...masked(body), ...photoLayer(model.image), mixBlendMode: "overlay", opacity: 0.75 }}
            />
          )}
        </>
      )}
      {tint.fillHex && (
        <>
          <span aria-hidden="true" className="absolute inset-0" style={{ ...masked(fill), backgroundColor: tint.fillHex }} />
          <span
            aria-hidden="true"
            className="absolute inset-0"
            style={{ ...masked(fill), ...photoLayer(model.image), mixBlendMode: "multiply" }}
          />
        </>
      )}
    </>
  );
}

type Props = {
  model: MezuzahModel;
  /** Tailwind classes for the box (size / aspect ratio). */
  className?: string;
  sizes: string;
  preload?: boolean;
  /** Apply the shared size/centre/straightening so every model looks alike (gallery, summary). */
  fit?: boolean;
  tint?: Tint;
};

/**
 * Model photo inside a fixed, clean box. object-contain keeps the whole mezuzah
 * visible (never cropped); if the file fails to load a neutral fallback is shown.
 */
export default function ModelImage({
  model,
  className = "aspect-square w-full",
  sizes,
  preload = false,
  fit = true,
  tint,
}: Props) {
  const [failed, setFailed] = useState(false);

  return (
    <span className={`relative block overflow-hidden rounded-xl bg-white ${className}`}>
      {failed ? (
        <span className="absolute inset-0 flex items-center justify-center p-3 text-center text-sm text-brown-soft">
          התמונה תתעדכן בקרוב
        </span>
      ) : (
        <span className="absolute inset-0 isolate" style={fit ? fitStyle(model.fit) : undefined}>
          <Image
            src={model.image}
            alt={model.imageAlt}
            fill
            preload={preload}
            sizes={sizes}
            className="object-contain"
            onError={() => setFailed(true)}
          />
          {tint && <TintLayers model={model} tint={tint} />}
        </span>
      )}
    </span>
  );
}
