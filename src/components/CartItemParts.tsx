import type { ResolvedLine } from "@/lib/cart/resolve";
import { formatPrice } from "@/lib/money";
import ModelImage from "./ModelImage";
import Swatch from "./Swatch";

function Dot({ hex, name }: { hex: string; name: string }) {
  return <Swatch hex={hex} name={name} className="h-3.5 w-3.5 align-middle" />;
}

/** The mezuzah photo, tinted with the chosen colours (the same preview as on the order screen). */
export function ItemThumb({ item, className = "h-24 w-24" }: { item: ResolvedLine; className?: string }) {
  if (!item.model) {
    return (
      <div className={`${className} flex shrink-0 items-center justify-center rounded-xl border border-dashed border-line bg-white text-xs text-brown-soft`}>
        לא זמין
      </div>
    );
  }
  return (
    <ModelImage
      model={item.model}
      tint={{ bodyHex: item.bodyColor?.hex ?? null, fillHex: item.fillColor?.hex ?? null }}
      className={`${className} shrink-0`}
      sizes="112px"
    />
  );
}

/**
 * Price of ONE unit. Without a parchment: just "מחיר ליחידה". With one, the three numbers are spelled
 * out: the mezuzah, the parchment surcharge and the total per unit.
 */
export function UnitPrice({ item }: { item: ResolvedLine }) {
  if (item.unitPriceAgorot === null) return null;
  if (item.parchmentPriceAgorot === null || item.modelPriceAgorot === null) {
    return (
      <p className="text-sm text-brown-soft">
        מחיר ליחידה: <strong data-unit-price className="text-brown">{formatPrice(item.unitPriceAgorot)}</strong>
      </p>
    );
  }
  return (
    <dl data-unit-breakdown className="space-y-0.5 text-sm text-brown-soft">
      <div className="flex justify-between gap-3">
        <dt>מחיר המזוזה</dt>
        <dd data-model-price className="text-brown">{formatPrice(item.modelPriceAgorot)}</dd>
      </div>
      <div className="flex justify-between gap-3">
        <dt>תוספת קלף</dt>
        <dd data-parchment-price className="text-brown">+{formatPrice(item.parchmentPriceAgorot)}</dd>
      </div>
      <div className="flex justify-between gap-3 border-t border-line pt-0.5">
        <dt className="font-semibold">מחיר כולל ליחידה</dt>
        <dd data-unit-price className="font-bold text-brown">{formatPrice(item.unitPriceAgorot)}</dd>
      </div>
    </dl>
  );
}

/** Model name and the chosen options, one per line. */
export function ItemDetails({ item }: { item: ResolvedLine }) {
  const { line } = item;
  return (
    <div className="min-w-0 text-sm">
      <p data-item-name className="text-base font-bold leading-tight">
        {item.model?.name ?? (line.modelName || "דגם שהוסר")}
      </p>
      <dl className="mt-1 space-y-0.5 text-brown-soft">
        <div className="flex flex-wrap items-center gap-x-1.5">
          <dt>צבע גוף:</dt>
          <dd className="inline-flex items-center gap-1.5 text-brown">
            {item.bodyColor ? (
              <>
                <Dot hex={item.bodyColor.hex} name={item.bodyColor.name} /> {item.bodyColor.name}
              </>
            ) : (
              "—"
            )}
          </dd>
        </div>
        <div className="flex flex-wrap items-center gap-x-1.5">
          <dt>מילוי:</dt>
          <dd className="inline-flex items-center gap-1.5 text-brown">
            {line.fillType === "single" ? (
              <>
                {item.fill?.name ?? "צבע אחד"}
                {item.fillColor && (
                  <>
                    {" · "}
                    <Dot hex={item.fillColor.hex} name={item.fillColor.name} /> {item.fillColor.name}
                  </>
                )}
              </>
            ) : (
              (item.fill?.name ?? "ללא מילוי")
            )}
          </dd>
        </div>
        {line.personalText && (
          <div className="flex flex-wrap items-center gap-x-1.5">
            <dt>כיתוב אישי:</dt>
            <dd className="font-bold text-brown">{line.personalText}</dd>
          </div>
        )}
        {line.parchmentId && (
          <div data-item-parchment className="flex flex-wrap items-center gap-x-1.5">
            <dt>קלף:</dt>
            <dd className="text-brown">
              {item.parchment ? (
                <>
                  {item.parchment.name} <span className="text-brown-soft">(+{formatPrice(item.parchment.priceAgorot)})</span>
                </>
              ) : (
                "אינו זמין"
              )}
            </dd>
          </div>
        )}
      </dl>
    </div>
  );
}
