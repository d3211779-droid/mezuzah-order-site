"use client";

import Image from "next/image";
import { useState, type CSSProperties } from "react";
import type { MezuzahModel } from "@/data/catalog";

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

type Props = {
  model: MezuzahModel;
  /** Tailwind classes for the box (size / aspect ratio). */
  className?: string;
  sizes: string;
  preload?: boolean;
};

/**
 * Model photo inside a fixed, clean box. object-contain keeps the whole mezuzah
 * visible (never cropped); if the file fails to load a neutral fallback is shown.
 */
export default function ModelImage({ model, className = "aspect-square w-full", sizes, preload = false }: Props) {
  const [failed, setFailed] = useState(false);

  return (
    <span className={`relative block overflow-hidden rounded-xl bg-white ${className}`}>
      {failed ? (
        <span className="absolute inset-0 flex items-center justify-center p-3 text-center text-sm text-brown-soft">
          התמונה תתעדכן בקרוב
        </span>
      ) : (
        <Image
          src={model.image}
          alt={model.imageAlt}
          fill
          preload={preload}
          sizes={sizes}
          className="object-contain"
          style={fitStyle(model.fit)}
          onError={() => setFailed(true)}
        />
      )}
    </span>
  );
}
