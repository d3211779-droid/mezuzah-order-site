"use client";

import { useState } from "react";
import { createColor, moveRow, updateColor } from "@/app/admin/catalog-actions";
import { HEX_RE, type AdminColor } from "@/lib/admin/catalog";
import { swatchStyle } from "@/lib/colors/swatch";
import { ErrorLine, MoveButtons, PositionField, Toggle, inputClass, primaryButton, useRun } from "./catalog-ui";

/** Colour picker + hex text field that stay in sync. Reports every change. */
function HexField({ id, value, onChange }: { id: string; value: string; onChange: (hex: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        aria-label="בחירת גוון"
        value={HEX_RE.test(value) ? value : "#cccccc"}
        onChange={(e) => onChange(e.target.value.toUpperCase())}
        className="h-12 w-14 shrink-0 cursor-pointer rounded-xl border border-[#dccfbd] bg-white p-1"
      />
      <input
        id={id}
        dir="ltr"
        aria-label="קוד גוון (hex)"
        value={value}
        maxLength={7}
        onChange={(e) => onChange(e.target.value)}
        className={`${inputClass} w-32 text-right`}
      />
    </div>
  );
}

function BigSwatch({ hex, name }: { hex: string; name: string }) {
  return (
    <span
      aria-hidden="true"
      data-swatch
      className="block h-20 w-20 shrink-0 rounded-full border-2 border-black/15 shadow-inner"
      style={swatchStyle(HEX_RE.test(hex) ? hex : "#cccccc", name, "lg")}
    />
  );
}

function ColorCard({ color, position, isFirst, isLast }: { color: AdminColor; position: number; isFirst: boolean; isLast: boolean }) {
  const [name, setName] = useState(color.name);
  const [hex, setHex] = useState(color.hex);
  const { pending, error, run } = useRun();
  const dirty = name.trim() !== color.name || hex.toUpperCase() !== color.hex.toUpperCase();

  return (
    <li
      data-color-card
      className={`rounded-2xl border bg-white p-4 shadow-sm ${color.available ? "border-line" : "border-dashed border-[#cfc6b8] bg-[#faf7f2]"}`}
    >
      <div className="flex items-center gap-4">
        <div className={color.available ? "" : "opacity-50"}>
          <BigSwatch hex={hex} name={name} />
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <p className="flex items-center justify-between gap-2 text-sm text-brown-soft">
            <span>מיקום {position}</span>
            <span
              className={`rounded-full border px-3 py-0.5 text-sm font-bold ${
                color.available ? "border-[#aed3a4] bg-[#e0f0dc] text-[#2f5f27]" : "border-[#d3ccc1] bg-[#ece8e1] text-[#5c5148]"
              }`}
            >
              {color.available ? "זמין" : "לא זמין"}
            </span>
          </p>
          <label className="sr-only" htmlFor={`cname-${color.id}`}>
            שם הצבע
          </label>
          <input
            id={`cname-${color.id}`}
            value={name}
            maxLength={40}
            onChange={(e) => setName(e.target.value)}
            className={`${inputClass} font-bold`}
          />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <HexField id={`chex-${color.id}`} value={hex} onChange={setHex} />
        {dirty && (
          <button
            type="button"
            disabled={pending}
            onClick={() => run(() => updateColor(color.id, { name, hex }))}
            className={primaryButton}
          >
            שמירה
          </button>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Toggle
          checked={color.available}
          disabled={pending}
          onLabel="זמין"
          offLabel="לא זמין"
          onChange={(available) => run(() => updateColor(color.id, { available }))}
        />
        <MoveButtons
          isFirst={isFirst}
          isLast={isLast}
          disabled={pending}
          onMove={(direction) => run(() => moveRow("colors", color.id, direction))}
        />
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

function AddColorForm() {
  const [name, setName] = useState("");
  const [hex, setHex] = useState("#CCCCCC");
  const [available, setAvailable] = useState(true);
  const [position, setPosition] = useState("");
  const { pending, error, setError, run } = useRun();

  function submit() {
    if (!name.trim()) return setError("יש להזין שם לצבע.");
    if (!HEX_RE.test(hex)) return setError("קוד הצבע חייב להיות מהצורה #RRGGBB.");
    const sortOrder = position.trim() ? Number(position) : null;
    if (sortOrder !== null && (!Number.isInteger(sortOrder) || sortOrder < 1)) return setError("המיקום חייב להיות מספר שלם חיובי.");
    run(
      () => createColor(name, hex, { available, sortOrder }),
      () => {
        setName("");
        setHex("#CCCCCC");
        setAvailable(true);
        setPosition("");
      },
    );
  }

  return (
    <section aria-labelledby="add-color" className="rounded-2xl border border-gold-soft bg-[#fbf6ed] p-4">
      <h2 id="add-color" className="mb-3 text-lg font-bold">
        הוספת צבע
      </h2>
      <div className="grid gap-4 sm:grid-cols-[6rem_minmax(0,1fr)]">
        <div className="flex flex-col items-center gap-1">
          <BigSwatch hex={hex} name={name} />
          <span className="text-xs text-brown-soft">תצוגה מקדימה</span>
        </div>
        <div className="space-y-3">
          <input
            aria-label="שם הצבע החדש"
            placeholder="שם הצבע"
            value={name}
            maxLength={40}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
          />
          <HexField id="new-color-hex" value={hex} onChange={setHex} />
          <div className="grid gap-3 sm:grid-cols-2 sm:items-end">
            <PositionField value={position} onChange={setPosition} />
            <Toggle checked={available} onChange={setAvailable} onLabel="זמין מיד" offLabel="יתווסף כלא זמין" />
          </div>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button type="button" disabled={pending} onClick={submit} className={primaryButton}>
          {pending ? "שומר…" : "הוספת צבע"}
        </button>
        {error && <ErrorLine>{error}</ErrorLine>}
      </div>
    </section>
  );
}

export default function ColorsManager({ colors }: { colors: AdminColor[] }) {
  const availableCount = colors.filter((c) => c.available).length;
  return (
    <div className="space-y-5">
      <AddColorForm />
      <p className="text-sm text-brown-soft">
        {colors.length} צבעים, {availableCount} זמינים. צבע שסומן &quot;לא זמין&quot; לא מוצג ללקוחות (לא כצבע גוף ולא כצבע
        מילוי) אך נשמר בהזמנות קיימות.
      </p>
      {colors.length === 0 ? (
        <p className="rounded-2xl border border-line bg-white p-8 text-center text-brown-soft">עדיין אין צבעים.</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {colors.map((c, i) => (
            <ColorCard key={c.id} color={c} position={i + 1} isFirst={i === 0} isLast={i === colors.length - 1} />
          ))}
        </ul>
      )}
    </div>
  );
}
