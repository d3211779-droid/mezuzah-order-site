import type { ReactNode } from "react";
import { useCatalog } from "@/lib/catalog/context";
import { formatPrice } from "@/lib/money";
import type { ItemValues } from "@/lib/validation";
import Swatch from "./Swatch";

const EMPTY = "—";

function ColorValue({ id }: { id: string | null }) {
  const { getColor } = useCatalog();
  const color = getColor(id);
  if (!color) return <>{EMPTY}</>;
  return (
    <span className="inline-flex items-center gap-2">
      <Swatch hex={color.hex} name={color.name} className="h-4 w-4 border-white/60" />
      {color.name}
    </span>
  );
}

/** Summary of the mezuzah being configured (the contact details are entered later, at checkout). */
export default function OrderSummary({ values }: { values: ItemValues }) {
  const { getModel, getFill, settings } = useCatalog();
  const personalText = values.personalText.trim();

  const model = getModel(values.modelId);
  const fill = getFill(values.fillId);
  const fillKind = fill?.id ?? "none";
  const price = model?.priceAgorot ?? null;

  const rows: [string, ReactNode][] = [
    ["דגם", model?.name ?? EMPTY],
    ["צבע גוף", <ColorValue key="body" id={values.colorId} />],
    ["סוג מילוי", fill?.name ?? EMPTY],
    ...(fillKind === "single"
      ? ([["צבע מילוי", <ColorValue key="fill" id={values.fillColorId} />]] as [string, ReactNode][])
      : []),
    ...(personalText ? ([["טקסט אישי", personalText]] as [string, ReactNode][]) : []),
    [
      "מחיר",
      price === null ? (
        EMPTY
      ) : (
        <span data-summary-price>
          {formatPrice(price)} <span className="text-xs font-normal text-[#d9c39a]">כולל מע״מ</span>
        </span>
      ),
    ],
  ];

  return (
    <dl className="space-y-3 text-sm">
      {rows.map(([label, value]) => (
        <div key={label} className="flex items-baseline justify-between gap-4 border-b border-white/15 pb-2">
          <dt className="shrink-0 text-[#d9c39a]">{label}</dt>
          <dd className="font-medium break-words text-left">{value}</dd>
        </div>
      ))}
      {settings.closedBackTitle && (
        <div className="rounded-xl bg-white/10 px-3 py-2">
          <dt className="sr-only">מבנה המזוזה</dt>
          <dd>
            <span className="font-medium">{settings.closedBackTitle}</span>
            {settings.closedBackText && <span className="block text-xs text-[#d9c39a]">{settings.closedBackText}</span>}
          </dd>
        </div>
      )}
    </dl>
  );
}
