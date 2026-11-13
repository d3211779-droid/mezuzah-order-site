"use client";

import Image from "next/image";
import { useState } from "react";
import type { MezuzahModel } from "@/data/catalog";
import { ModelIcon } from "./MezuzahPreview";

/**
 * Product photo in a fixed-ratio, light container. object-contain keeps the whole
 * mezuzah visible (no cropping); if the file fails to load a clean fallback is shown.
 */
export default function ModelImage({ model, preload = false }: { model: MezuzahModel; preload?: boolean }) {
  const [failed, setFailed] = useState(false);

  return (
    <span className="relative block aspect-square w-full overflow-hidden rounded-xl border border-line bg-white">
      {failed ? (
        <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-sm text-brown-soft">
          <ModelIcon model={model.glyph} className="h-24 w-20" />
          <span>התמונה תתעדכן בקרוב</span>
        </span>
      ) : (
        <Image
          src={model.image}
          alt={model.imageAlt}
          fill
          preload={preload}
          sizes="(min-width: 1280px) 220px, (min-width: 640px) 45vw, 92vw"
          className="object-contain p-3"
          onError={() => setFailed(true)}
        />
      )}
    </span>
  );
}
