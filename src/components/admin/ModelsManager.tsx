"use client";

import { useRef, useState } from "react";
import { createModel, moveRow, updateModel } from "@/app/admin/catalog-actions";
import type { AdminModel } from "@/lib/admin/catalog";
import { uploadModelImage } from "@/lib/admin/upload";
import { ErrorLine, MoveButtons, Toggle, inputClass, primaryButton, secondaryButton, useRun } from "./catalog-ui";

const ACCEPT = "image/jpeg,image/png,image/webp";

function ModelRow({ model, isFirst, isLast }: { model: AdminModel; isFirst: boolean; isLast: boolean }) {
  const [name, setName] = useState(model.name);
  const [uploading, setUploading] = useState(false);
  const { pending, error, setError, run } = useRun();
  const fileRef = useRef<HTMLInputElement>(null);
  const busy = pending || uploading;
  const dirty = name.trim() !== model.name;

  async function replaceImage(file: File) {
    setError(null);
    setUploading(true);
    const uploaded = await uploadModelImage(file);
    setUploading(false);
    if (!uploaded.ok) return setError(uploaded.error);
    run(() => updateModel(model.id, { imageUrl: uploaded.url }));
  }

  return (
    <li className={`rounded-2xl border bg-white p-4 shadow-sm ${model.active ? "border-line" : "border-line opacity-80"}`}>
      <div className="flex gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={model.image_url}
          alt=""
          className="h-24 w-24 shrink-0 rounded-xl border border-line bg-white object-contain"
        />
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex gap-2">
            <label className="sr-only" htmlFor={`name-${model.id}`}>
              שם הדגם
            </label>
            <input
              id={`name-${model.id}`}
              value={name}
              maxLength={80}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
            />
            {dirty && (
              <button
                type="button"
                disabled={busy}
                onClick={() => run(() => updateModel(model.id, { name }))}
                className={primaryButton}
              >
                שמירה
              </button>
            )}
          </div>
          {!model.mask_body_url && (
            <p className="text-xs text-brown-soft">לדגם זה אין עדיין הדמיית צבע חיה; הלקוח יראה את התמונה המקורית.</p>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Toggle
          checked={model.active}
          disabled={busy}
          onLabel="פעיל"
          offLabel="מוסתר"
          onChange={(active) => run(() => updateModel(model.id, { active }))}
        />
        <MoveButtons
          isFirst={isFirst}
          isLast={isLast}
          disabled={busy}
          onMove={(direction) => run(() => moveRow("models", model.id, direction))}
        />
        <input
          ref={fileRef}
          type="file"
          accept={ACCEPT}
          className="sr-only"
          aria-label="בחירת תמונה חדשה"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (file) void replaceImage(file);
          }}
        />
        <button type="button" disabled={busy} onClick={() => fileRef.current?.click()} className={secondaryButton}>
          {uploading ? "מעלה…" : "החלפת תמונה"}
        </button>
        {pending && <span className="text-sm text-brown-soft">שומר…</span>}
      </div>
      {error && <div className="mt-2"><ErrorLine>{error}</ErrorLine></div>}
    </li>
  );
}

function AddModelForm() {
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const { pending, error, setError, run } = useRun();
  const fileRef = useRef<HTMLInputElement>(null);
  const busy = pending || uploading;

  async function submit() {
    setError(null);
    if (!name.trim()) return setError("יש להזין שם לדגם.");
    if (!file) return setError("יש לבחור תמונה.");
    setUploading(true);
    const uploaded = await uploadModelImage(file);
    setUploading(false);
    if (!uploaded.ok) return setError(uploaded.error);
    run(
      () => createModel(name, uploaded.url),
      () => {
        setName("");
        setFile(null);
        if (fileRef.current) fileRef.current.value = "";
      },
    );
  }

  return (
    <section aria-labelledby="add-model" className="rounded-2xl border border-gold-soft bg-[#fbf6ed] p-4">
      <h2 id="add-model" className="mb-3 font-bold">
        הוספת דגם
      </h2>
      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-center">
        <input
          aria-label="שם הדגם החדש"
          placeholder="שם הדגם"
          value={name}
          maxLength={80}
          onChange={(e) => setName(e.target.value)}
          className={inputClass}
        />
        <input
          ref={fileRef}
          type="file"
          accept={ACCEPT}
          aria-label="תמונת הדגם"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="min-h-12 w-full rounded-xl border border-[#dccfbd] bg-white px-3 py-2.5 text-sm file:me-3 file:rounded-lg file:border-0 file:bg-gold-soft file:px-3 file:py-1.5 file:font-semibold"
        />
        <button type="button" disabled={busy} onClick={submit} className={primaryButton}>
          {uploading ? "מעלה…" : pending ? "שומר…" : "הוספה"}
        </button>
      </div>
      {error && <div className="mt-2"><ErrorLine>{error}</ErrorLine></div>}
    </section>
  );
}

export default function ModelsManager({ models }: { models: AdminModel[] }) {
  return (
    <div className="space-y-5">
      <AddModelForm />
      {models.length === 0 ? (
        <p className="rounded-2xl border border-line bg-white p-8 text-center text-brown-soft">עדיין אין דגמים.</p>
      ) : (
        <ul className="space-y-3">
          {models.map((m, i) => (
            <ModelRow key={m.id} model={m} isFirst={i === 0} isLast={i === models.length - 1} />
          ))}
        </ul>
      )}
    </div>
  );
}
