"use client";

import { useState } from "react";
import { createParchment, moveRow, updateParchment } from "@/app/admin/catalog-actions";
import type { AdminParchment } from "@/lib/admin/catalog";
import { agorotToInput, parseShekels } from "@/lib/money";
import { ErrorLine, MoveButtons, PositionField, Toggle, inputClass, primaryButton, useRun } from "./catalog-ui";

/** Size field: a whole number of centimetres, kept as text while typing. */
const parseSize = (text: string): number | null => (/^\d{1,3}$/.test(text.trim()) ? Number(text.trim()) : null);

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-brown-soft">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-brown-soft">{hint}</span>}
    </label>
  );
}

function ParchmentCard({
  parchment,
  position,
  isFirst,
  isLast,
}: {
  parchment: AdminParchment;
  position: number;
  isFirst: boolean;
  isLast: boolean;
}) {
  const [name, setName] = useState(parchment.name);
  const [description, setDescription] = useState(parchment.description ?? "");
  const [note, setNote] = useState(parchment.note ?? "");
  const [size, setSize] = useState(String(parchment.size_cm));
  const [price, setPrice] = useState(agorotToInput(parchment.price_agorot));
  const { pending, error, setError, run } = useRun();

  const parsedPrice = parseShekels(price);
  const parsedSize = parseSize(size);
  const dirty =
    name.trim() !== parchment.name ||
    description.trim() !== (parchment.description ?? "") ||
    note.trim() !== (parchment.note ?? "") ||
    parsedSize !== parchment.size_cm ||
    !parsedPrice.ok ||
    parsedPrice.agorot !== parchment.price_agorot;
  const noPrice = parchment.price_agorot === null;

  function save() {
    setError(null);
    if (!name.trim()) return setError("השם לא יכול להיות ריק.");
    if (parsedSize === null || parsedSize < 1 || parsedSize > 100) return setError("הגודל חייב להיות מספר שלם בין 1 ל-100 ס״מ.");
    if (!parsedPrice.ok) return setError(parsedPrice.error);
    run(() =>
      updateParchment(parchment.id, {
        name,
        description,
        note,
        sizeCm: parsedSize,
        priceAgorot: parsedPrice.agorot,
      }),
    );
  }

  return (
    <li
      data-parchment-card
      className={`rounded-2xl border bg-white p-4 shadow-sm ${parchment.available ? "border-line" : "border-dashed border-[#cfc6b8] bg-[#faf7f2]"}`}
    >
      <p className="mb-3 flex items-center justify-between gap-2 text-sm text-brown-soft">
        <span>מיקום {position}</span>
        <span
          className={`rounded-full border px-3 py-0.5 text-sm font-bold ${
            parchment.available ? "border-[#aed3a4] bg-[#e0f0dc] text-[#2f5f27]" : "border-[#d3ccc1] bg-[#ece8e1] text-[#5c5148]"
          }`}
        >
          {parchment.available ? "זמין" : "לא זמין"}
        </span>
      </p>

      <div className="space-y-3">
        <Field label="שם הקלף (מוצג ללקוחות בדיוק כך)">
          <input
            aria-label="שם הקלף"
            value={name}
            maxLength={80}
            onChange={(e) => setName(e.target.value)}
            className={`${inputClass} font-bold`}
          />
        </Field>
        <Field label="תיאור קצר">
          <input
            aria-label="תיאור הקלף"
            value={description}
            maxLength={200}
            placeholder="לדוגמה: מתאים לבית המזוזה"
            onChange={(e) => setDescription(e.target.value)}
            className={inputClass}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="גודל (ס״מ)">
            <input
              aria-label="גודל הקלף בסנטימטרים"
              dir="ltr"
              inputMode="numeric"
              value={size}
              onChange={(e) => setSize(e.target.value)}
              className={`${inputClass} text-right`}
            />
          </Field>
          <Field label="מחיר (₪, כולל מע״מ)">
            <input
              aria-label="מחיר הקלף בשקלים"
              dir="ltr"
              inputMode="decimal"
              value={price}
              placeholder="ללא מחיר"
              aria-invalid={!parsedPrice.ok}
              onChange={(e) => setPrice(e.target.value)}
              className={`${inputClass} text-right`}
            />
          </Field>
        </div>
        <Field label="הערה ללקוחות (אופציונלי)">
          <textarea
            aria-label="הערה על הקלף"
            rows={2}
            value={note}
            maxLength={500}
            onChange={(e) => setNote(e.target.value)}
            className={`${inputClass} py-3`}
          />
        </Field>
      </div>

      {!parsedPrice.ok && (
        <p role="alert" className="mt-2 text-sm font-medium text-error">
          {parsedPrice.error}
        </p>
      )}
      {noPrice && (
        <p data-no-price-warning className="mt-3 rounded-lg bg-[#fbf1dc] px-3 py-2 text-sm text-[#7a5600]">
          אין מחיר: אי אפשר להפעיל את הקלף עד שמזינים מחיר ושומרים.
        </p>
      )}

      {dirty && (
        <button type="button" disabled={pending} onClick={save} className={`${primaryButton} mt-3`}>
          {pending ? "שומר…" : "שמירה"}
        </button>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Toggle
          checked={parchment.available}
          disabled={pending || (noPrice && !parchment.available)}
          onLabel="זמין"
          offLabel="לא זמין"
          onChange={(available) => run(() => updateParchment(parchment.id, { available }))}
        />
        <MoveButtons
          isFirst={isFirst}
          isLast={isLast}
          disabled={pending}
          onMove={(direction) => run(() => moveRow("parchments", parchment.id, direction))}
        />
      </div>
      {error && (
        <div className="mt-2">
          <ErrorLine>{error}</ErrorLine>
        </div>
      )}
    </li>
  );
}

function AddParchmentForm() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [note, setNote] = useState("");
  const [size, setSize] = useState("12");
  const [price, setPrice] = useState("");
  const [available, setAvailable] = useState(false);
  const [position, setPosition] = useState("");
  const { pending, error, setError, run } = useRun();

  function submit() {
    setError(null);
    if (!name.trim()) return setError("יש להזין שם לקלף.");
    const sizeCm = parseSize(size);
    if (sizeCm === null || sizeCm < 1 || sizeCm > 100) return setError("הגודל חייב להיות מספר שלם בין 1 ל-100 ס״מ.");
    const parsedPrice = parseShekels(price);
    if (!parsedPrice.ok) return setError(parsedPrice.error);
    if (available && parsedPrice.agorot === null) return setError("אי אפשר להפעיל קלף בלי מחיר.");
    const sortOrder = position.trim() ? Number(position) : null;
    if (sortOrder !== null && (!Number.isInteger(sortOrder) || sortOrder < 1)) return setError("המיקום חייב להיות מספר שלם חיובי.");
    run(
      () => createParchment({ name, description, note, sizeCm, priceAgorot: parsedPrice.agorot, available, sortOrder }),
      () => {
        setName("");
        setDescription("");
        setNote("");
        setSize("12");
        setPrice("");
        setAvailable(false);
        setPosition("");
      },
    );
  }

  return (
    <section aria-labelledby="add-parchment" className="rounded-2xl border border-gold-soft bg-[#fbf6ed] p-4">
      <h2 id="add-parchment" className="mb-3 text-lg font-bold">
        הוספת קלף
      </h2>
      <div className="space-y-3">
        <input
          aria-label="שם הקלף החדש"
          placeholder="שם הקלף, לדוגמה: קלף 12 ס״מ"
          value={name}
          maxLength={80}
          onChange={(e) => setName(e.target.value)}
          className={inputClass}
        />
        <input
          aria-label="תיאור הקלף החדש"
          placeholder="תיאור קצר (אופציונלי)"
          value={description}
          maxLength={200}
          onChange={(e) => setDescription(e.target.value)}
          className={inputClass}
        />
        <div className="grid grid-cols-2 gap-3">
          <Field label="גודל (ס״מ)">
            <input
              aria-label="גודל הקלף החדש בסנטימטרים"
              dir="ltr"
              inputMode="numeric"
              value={size}
              onChange={(e) => setSize(e.target.value)}
              className={`${inputClass} text-right`}
            />
          </Field>
          <Field label="מחיר (₪, כולל מע״מ)">
            <input
              aria-label="מחיר הקלף החדש"
              dir="ltr"
              inputMode="decimal"
              value={price}
              placeholder="לדוגמה 30"
              onChange={(e) => setPrice(e.target.value)}
              className={`${inputClass} text-right`}
            />
          </Field>
        </div>
        <textarea
          aria-label="הערה על הקלף החדש"
          placeholder="הערה ללקוחות (אופציונלי)"
          rows={2}
          value={note}
          maxLength={500}
          onChange={(e) => setNote(e.target.value)}
          className={`${inputClass} py-3`}
        />
        <div className="grid gap-3 sm:grid-cols-2 sm:items-end">
          <PositionField value={position} onChange={setPosition} />
          <Toggle checked={available} onChange={setAvailable} onLabel="זמין מיד" offLabel="יתווסף כלא זמין" />
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button type="button" disabled={pending} onClick={submit} className={primaryButton}>
          {pending ? "שומר…" : "הוספת קלף"}
        </button>
        {error && <ErrorLine>{error}</ErrorLine>}
      </div>
    </section>
  );
}

export default function ParchmentsManager({ parchments }: { parchments: AdminParchment[] }) {
  const availableCount = parchments.filter((p) => p.available).length;
  return (
    <div className="space-y-5">
      <AddParchmentForm />
      <p className="text-sm text-brown-soft">
        {parchments.length} קלפים, {availableCount} זמינים. הקלף הוא תוספת בתשלום למזוזה, והמחיר שלו מתווסף למחיר המזוזה. אם אין אף קלף
        זמין, הלקוחות לא רואים את אפשרות הקלף בכלל. קלף זמין חייב מחיר. שינוי מחיר משפיע על הזמנות חדשות בלבד, והזמנות קיימות שומרות את
        השם והמחיר שהיו בזמן ההזמנה. הסדר כאן הוא הסדר באתר.
      </p>
      {parchments.length === 0 ? (
        <p className="rounded-2xl border border-line bg-white p-8 text-center text-brown-soft">עדיין אין קלפים.</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {parchments.map((p, i) => (
            <ParchmentCard key={p.id} parchment={p} position={i + 1} isFirst={i === 0} isLast={i === parchments.length - 1} />
          ))}
        </ul>
      )}
    </div>
  );
}
