import type { ReactNode } from "react";
import { getColor, getFill, getModel } from "@/data/catalog";
import type { OrderValues } from "@/lib/validation";

const EMPTY = "—";

function ColorValue({ id }: { id: string | null }) {
  const color = getColor(id);
  if (!color) return <>{EMPTY}</>;
  return (
    <span className="inline-flex items-center gap-2">
      <span
        aria-hidden="true"
        className="inline-block h-4 w-4 shrink-0 rounded-full border border-white/60"
        style={{ backgroundColor: color.hex }}
      />
      {color.name}
    </span>
  );
}

function fillValue(values: OrderValues): ReactNode {
  const fill = getFill(values.fillId);
  if (fill.id === "none") return fill.name;
  return (
    <span className="inline-flex flex-wrap items-center justify-end gap-x-2">
      {fill.name}: <ColorValue id={values.fillColorId} />
    </span>
  );
}

export default function OrderSummary({ values }: { values: OrderValues }) {
  const personalText = values.personalText.trim();
  const note = values.note.trim();

  const rows: [string, ReactNode][] = [
    ["דגם", getModel(values.modelId)?.name ?? EMPTY],
    ["צבע", <ColorValue key="color" id={values.colorId} />],
    ["מילוי", fillValue(values)],
    ...(personalText ? ([["טקסט אישי", personalText]] as [string, ReactNode][]) : []),
    ["שם מלא", values.fullName.trim() || EMPTY],
    ["טלפון", values.phone.trim() || EMPTY],
  ];

  return (
    <dl className="space-y-3 text-sm">
      {rows.map(([label, value]) => (
        <div key={label} className="flex items-baseline justify-between gap-4 border-b border-white/15 pb-2">
          <dt className="shrink-0 text-[#d9c39a]">{label}</dt>
          <dd className="font-medium break-words text-left" dir={label === "טלפון" ? "ltr" : undefined}>
            {value}
          </dd>
        </div>
      ))}
      {note && (
        <div>
          <dt className="text-[#d9c39a]">הערה</dt>
          <dd className="mt-1 break-words whitespace-pre-wrap">{note}</dd>
        </div>
      )}
      <div className="rounded-xl bg-white/10 px-3 py-2">
        <dt className="sr-only">מבנה המזוזה</dt>
        <dd>
          <span className="font-medium">המזוזה סגורה מאחור</span>
          <span className="block text-xs text-[#d9c39a]">למראה נקי ולשמירה על הקלף</span>
        </dd>
      </div>
    </dl>
  );
}
