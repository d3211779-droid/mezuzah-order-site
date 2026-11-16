"use client";

import { useState, useTransition, type ReactNode } from "react";
import type { ActionResult } from "@/lib/admin/catalog";

/** Runs a server action, tracking "saving" and a visible error message. */
export function useRun() {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const run = (fn: () => Promise<ActionResult>, onOk?: () => void) => {
    setError(null);
    start(async () => {
      const result = await fn();
      if (result.ok) onOk?.();
      else setError(result.error);
    });
  };
  return { pending, error, setError, run };
}

export const inputClass =
  "min-h-12 w-full rounded-xl border border-[#dccfbd] bg-paper px-4 text-base outline-none transition focus:border-gold focus:ring-2 focus:ring-gold-soft";

export const primaryButton =
  "min-h-12 rounded-2xl bg-gold px-6 font-bold text-white transition hover:bg-[#9c7a3e] disabled:cursor-wait disabled:opacity-60";

export const secondaryButton =
  "flex min-h-12 min-w-12 items-center justify-center rounded-xl border border-line bg-white px-3 font-semibold transition hover:border-gold disabled:cursor-not-allowed disabled:opacity-40";

/** Optional "display position" number field for the add forms. */
export function PositionField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-brown-soft">מיקום בתצוגה (אופציונלי)</span>
      <input
        type="number"
        inputMode="numeric"
        min={1}
        max={100000}
        dir="ltr"
        value={value}
        placeholder="בסוף הרשימה"
        onChange={(e) => onChange(e.target.value)}
        className={`${inputClass} text-right`}
      />
    </label>
  );
}

/** Accessible on/off switch with a visible text label. */
export function Toggle({
  checked,
  onChange,
  onLabel,
  offLabel,
  disabled,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  onLabel: string;
  offLabel: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`flex min-h-12 items-center gap-3 rounded-xl border px-4 font-semibold transition disabled:cursor-wait disabled:opacity-60 ${
        checked ? "border-[#aed3a4] bg-[#e0f0dc] text-[#2f5f27]" : "border-line bg-[#efedea] text-brown-soft"
      }`}
    >
      <span
        aria-hidden="true"
        className={`relative h-6 w-11 rounded-full transition ${checked ? "bg-[#4f9a43]" : "bg-[#b9b2a8]"}`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? "right-0.5" : "right-[1.375rem]"}`}
        />
      </span>
      {checked ? onLabel : offLabel}
    </button>
  );
}

export function MoveButtons({
  onMove,
  isFirst,
  isLast,
  disabled,
}: {
  onMove: (direction: "up" | "down") => void;
  isFirst: boolean;
  isLast: boolean;
  disabled?: boolean;
}) {
  return (
    <div className="flex gap-2">
      <button
        type="button"
        aria-label="הזזה קדימה"
        disabled={disabled || isFirst}
        onClick={() => onMove("up")}
        className={secondaryButton}
      >
        →
      </button>
      <button
        type="button"
        aria-label="הזזה אחורה"
        disabled={disabled || isLast}
        onClick={() => onMove("down")}
        className={secondaryButton}
      >
        ←
      </button>
    </div>
  );
}

export function ErrorLine({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="text-sm font-medium text-error">
      {children}
    </p>
  );
}
