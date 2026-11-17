"use client";

import { useRef, useState } from "react";
import { createModel, moveRow, updateModel } from "@/app/admin/catalog-actions";
import type { AdminModel } from "@/lib/admin/catalog";
import { uploadModelImage } from "@/lib/admin/upload";
import { agorotToInput, parseShekels } from "@/lib/money";
import { ErrorLine, MoveButtons, PositionField, Toggle, inputClass, primaryButton, secondaryButton, useRun } from "./catalog-ui";

const ACCEPT = "image/jpeg,image/png,image/webp";

/** Price in shekels (VAT included). Empty = no price: customers cannot order the model. */
function PriceEditor({ model }: { model: AdminModel }) {
  const [text, setText] = useState(agorotToInput(model.price_agorot));
  const { pending, error, run } = useRun();
  const parsed = parseShekels(text);
  const dirty = !parsed.ok || parsed.agorot !== model.price_agorot;
  const id = `price-${model.id}`;

  return (
    <div data-price-editor className="mt-3">
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-brown-soft">
        מחיר בשקלים (כולל מע״מ)
      </label>
      <div className="flex gap-2">
        <div className="relative min-w-0 flex-1">
          <input
            id={id}
            dir="ltr"
            inputMode="decimal"
            value={text}
            placeholder="ללא מחיר"
            disabled={pending}
            aria-invalid={!parsed.ok}
            onChange={(e) => setText(e.target.value)}
            className={`${inputClass} pe-9 text-right`}
          />
          <span aria-hidden="true" className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-brown-soft">
            ₪
          </span>
        </div>
        {dirty && parsed.ok && (
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              run(
                () => updateModel(model.id, { priceAgorot: parsed.agorot }),
                () => setText(agorotToInput(parsed.agorot)),
              )
            }
            className={primaryButton}
          >
            {pending ? "שומר…" : "שמירה"}
          </button>
        )}
      </div>
      {!parsed.ok && (
        <p role="alert" className="mt-1 text-sm font-medium text-error">
          {parsed.error}
        </p>
      )}
      {error && (
        <p role="alert" className="mt-1 text-sm font-medium text-error">
          {error}
        </p>
      )}
      {model.price_agorot === null && (
        <p data-no-price-warning className="mt-2 rounded-lg bg-[#fbf1dc] px-3 py-2 text-sm text-[#7a5600]">
          אין מחיר: הלקוחות רואים &quot;המחיר יעודכן בקרוב&quot; ולא יכולים להזמין דגם זה.
        </p>
      )}
    </div>
  );
}

function ModelCard({ model, position, isFirst, isLast }: { model: AdminModel; position: number; isFirst: boolean; isLast: boolean }) {
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
    <li
      data-model-card
      className={`flex flex-col rounded-2xl border bg-white p-4 shadow-sm ${
        model.active ? "border-line" : "border-dashed border-[#cfc6b8] bg-[#faf7f2]"
      }`}
    >
      <div className="relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={model.image_url}
          alt={`תמונת הדגם ${model.name}`}
          className={`h-48 w-full rounded-xl border border-line bg-white object-contain ${model.active ? "" : "opacity-50 grayscale"}`}
        />
        <span className="absolute start-2 top-2 flex h-8 min-w-8 items-center justify-center rounded-full bg-brown px-2 text-sm font-bold text-white">
          {position}
        </span>
        <span
          className={`absolute end-2 top-2 rounded-full border px-3 py-1 text-sm font-bold ${
            model.active ? "border-[#aed3a4] bg-[#e0f0dc] text-[#2f5f27]" : "border-[#d3ccc1] bg-[#ece8e1] text-[#5c5148]"
          }`}
        >
          {model.active ? "פעיל" : "מוסתר"}
        </span>
      </div>

      <div className="mt-3 flex gap-2">
        <label className="sr-only" htmlFor={`name-${model.id}`}>
          שם הדגם
        </label>
        <input
          id={`name-${model.id}`}
          value={name}
          maxLength={80}
          onChange={(e) => setName(e.target.value)}
          className={`${inputClass} font-bold`}
        />
        {dirty && (
          <button type="button" disabled={busy} onClick={() => run(() => updateModel(model.id, { name }))} className={primaryButton}>
            שמירה
          </button>
        )}
      </div>
      <PriceEditor model={model} />
      {!model.mask_body_url && (
        <p className="mt-2 text-xs text-brown-soft">לדגם זה אין עדיין הדמיית צבע חיה; הלקוח יראה את התמונה המקורית.</p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
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
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <input
          ref={fileRef}
          type="file"
          accept={ACCEPT}
          className="sr-only"
          aria-label={`בחירת תמונה חדשה לדגם ${model.name}`}
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
      {error && (
        <div className="mt-2">
          <ErrorLine>{error}</ErrorLine>
        </div>
      )}
    </li>
  );
}

function AddModelForm() {
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [active, setActive] = useState(true);
  const [position, setPosition] = useState("");
  const [price, setPrice] = useState("");
  const [uploading, setUploading] = useState(false);
  const { pending, error, setError, run } = useRun();
  const fileRef = useRef<HTMLInputElement>(null);
  const busy = pending || uploading;

  function pick(next: File | null) {
    if (preview) URL.revokeObjectURL(preview);
    setFile(next);
    setPreview(next ? URL.createObjectURL(next) : null);
  }

  async function submit() {
    setError(null);
    if (!name.trim()) return setError("יש להזין שם לדגם.");
    if (!file) return setError("יש לבחור תמונה.");
    const sortOrder = position.trim() ? Number(position) : null;
    if (sortOrder !== null && (!Number.isInteger(sortOrder) || sortOrder < 1)) return setError("המיקום חייב להיות מספר שלם חיובי.");
    const parsedPrice = parseShekels(price);
    if (!parsedPrice.ok) return setError(parsedPrice.error);
    setUploading(true);
    const uploaded = await uploadModelImage(file);
    setUploading(false);
    if (!uploaded.ok) return setError(uploaded.error);
    run(
      () => createModel(name, uploaded.url, { active, sortOrder, priceAgorot: parsedPrice.agorot }),
      () => {
        setName("");
        pick(null);
        setActive(true);
        setPosition("");
        setPrice("");
        if (fileRef.current) fileRef.current.value = "";
      },
    );
  }

  return (
    <section aria-labelledby="add-model" className="rounded-2xl border border-gold-soft bg-[#fbf6ed] p-4">
      <h2 id="add-model" className="mb-3 text-lg font-bold">
        הוספת דגם
      </h2>
      <div className="grid gap-4 sm:grid-cols-[8rem_minmax(0,1fr)]">
        <div className="flex h-32 items-center justify-center overflow-hidden rounded-xl border border-dashed border-gold bg-white text-sm text-brown-soft">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="תצוגה מקדימה של התמונה" className="h-full w-full object-contain" />
          ) : (
            "אין תמונה"
          )}
        </div>
        <div className="space-y-3">
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
            onChange={(e) => pick(e.target.files?.[0] ?? null)}
            className="min-h-12 w-full rounded-xl border border-[#dccfbd] bg-white px-3 py-2.5 text-sm file:me-3 file:rounded-lg file:border-0 file:bg-gold-soft file:px-3 file:py-1.5 file:font-semibold"
          />
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-brown-soft">מחיר בשקלים, כולל מע״מ (אפשר להשאיר ריק)</span>
            <input
              dir="ltr"
              inputMode="decimal"
              value={price}
              placeholder="לדוגמה 49.90"
              aria-label="מחיר הדגם החדש"
              onChange={(e) => setPrice(e.target.value)}
              className={`${inputClass} text-right`}
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2 sm:items-end">
            <PositionField value={position} onChange={setPosition} />
            <Toggle checked={active} onChange={setActive} onLabel="פעיל מיד" offLabel="יתווסף מוסתר" />
          </div>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button type="button" disabled={busy} onClick={submit} className={primaryButton}>
          {uploading ? "מעלה…" : pending ? "שומר…" : "הוספת דגם"}
        </button>
        {error && <ErrorLine>{error}</ErrorLine>}
      </div>
    </section>
  );
}

export default function ModelsManager({ models }: { models: AdminModel[] }) {
  const activeCount = models.filter((m) => m.active).length;
  const unpricedCount = models.filter((m) => m.price_agorot === null).length;
  return (
    <div className="space-y-5">
      <AddModelForm />
      <p className="text-sm text-brown-soft">
        {models.length} דגמים, {activeCount} פעילים{unpricedCount > 0 ? `, ${unpricedCount} ללא מחיר` : ""}. דגם מוסתר לא מוצג ללקוחות, ודגם
        בלי מחיר מוצג אבל אי אפשר להזמין אותו. שינוי מחיר משפיע על הזמנות חדשות בלבד. הסדר כאן הוא הסדר באתר (הראשון מימין).
      </p>
      {models.length === 0 ? (
        <p className="rounded-2xl border border-line bg-white p-8 text-center text-brown-soft">עדיין אין דגמים.</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {models.map((m, i) => (
            <ModelCard key={m.id} model={m} position={i + 1} isFirst={i === 0} isLast={i === models.length - 1} />
          ))}
        </ul>
      )}
    </div>
  );
}
