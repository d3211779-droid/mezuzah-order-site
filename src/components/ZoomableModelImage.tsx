"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { MezuzahModel } from "@/data/catalog";
import ModelImage from "./ModelImage";

function Lightbox({ model, onClose }: { model: MezuzahModel; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    ref.current?.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <dialog
      ref={ref}
      aria-label={model.name}
      onClose={onClose}
      onClick={(e) => {
        // Anything outside the photo itself (backdrop, empty space) closes it.
        if (!(e.target as HTMLElement).closest("[data-lightbox-frame]")) ref.current?.close();
      }}
      className="fixed inset-0 m-0 h-full max-h-none w-full max-w-none items-center justify-center bg-transparent p-3 backdrop:bg-black/75 open:flex"
    >
      <div
        data-lightbox-frame
        className="relative aspect-square w-[min(94vw,82dvh)] max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <Image
          src={model.image}
          alt={model.imageAlt}
          fill
          sizes="(min-width: 768px) 768px, 94vw"
          className="object-contain p-2"
        />
        <button
          type="button"
          onClick={() => ref.current?.close()}
          aria-label="סגירה"
          className="absolute right-2 top-2 flex h-11 w-11 items-center justify-center rounded-full bg-brown/85 text-2xl leading-none text-white transition hover:bg-brown"
        >
          ×
        </button>
      </div>
    </dialog>
  );
}

type Props = {
  model: MezuzahModel;
  className?: string;
  sizes: string;
  preload?: boolean;
};

/** A model photo that opens a larger view (lightbox) when pressed. */
export default function ZoomableModelImage({ model, className, sizes, preload }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`הגדלת התמונה: ${model.name}`}
        className="group relative block w-full cursor-zoom-in rounded-xl"
      >
        <ModelImage model={model} className={className} sizes={sizes} preload={preload} />
        <span
          aria-hidden="true"
          className="absolute bottom-1.5 left-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-brown/70 text-white transition group-hover:bg-brown"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="10.5" cy="10.5" r="6" />
            <path d="M15 15l5.5 5.5M10.5 8v5M8 10.5h5" />
          </svg>
        </span>
      </button>
      {open && <Lightbox model={model} onClose={() => setOpen(false)} />}
    </>
  );
}
