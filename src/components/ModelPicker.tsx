import { useCatalog } from "@/lib/catalog/context";
import { formatPrice } from "@/lib/money";
import ZoomableModelImage from "./ZoomableModelImage";

type Props = {
  value: string | null;
  onChange: (id: string) => void;
};

/**
 * Two cards per row on phones and tablets, three on wide desktops.
 * The photo opens a larger view; the name row below it selects the model.
 * A model without a price is shown (you can still zoom its photo) but cannot be selected.
 */
export default function ModelPicker({ value, onChange }: Props) {
  const { models } = useCatalog();
  const nothingOrderable = models.every((m) => m.priceAgorot === null);

  return (
    <>
      {nothingOrderable && (
        <p role="status" className="mb-4 rounded-xl bg-[#fbf6ed] px-4 py-3 text-sm text-gold-deep">
          כרגע לא ניתן להזמין – המחירים יעודכנו בקרוב.
        </p>
      )}
      <div role="radiogroup" aria-label="דגם" className="grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-3">
        {models.map((model, index) => {
          const price = model.priceAgorot;
          const orderable = price !== null;
          const selected = orderable && value === model.id;
          const inputId = `model-${model.id}`;
          return (
            <div
              key={model.id}
              data-model-card
              data-orderable={orderable}
              className={`rounded-2xl border-2 border-line p-2 transition has-[:checked]:border-gold has-[:checked]:bg-[#fbf6ed] has-[:checked]:shadow-sm has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-gold sm:p-3 ${
                orderable ? "bg-paper" : "bg-[#f6f2ea]"
              }`}
            >
              <input
                id={inputId}
                type="radio"
                name="model"
                value={model.id}
                checked={selected}
                disabled={!orderable}
                onChange={() => onChange(model.id)}
                className="sr-only"
              />
              <div className={orderable ? "" : "opacity-70"}>
                <ZoomableModelImage
                  model={model}
                  sizes="(min-width: 1280px) 220px, (min-width: 640px) 45vw, 46vw"
                  preload={index < 2}
                />
              </div>
              <label
                htmlFor={inputId}
                className={`-mx-2 -mb-2 mt-1 flex min-h-12 items-center justify-between gap-2 px-3 py-2 sm:-mx-3 sm:-mb-3 ${
                  orderable ? "cursor-pointer" : "cursor-not-allowed"
                }`}
              >
                <span className="min-w-0">
                  <span className="block text-sm font-semibold leading-tight sm:text-base">{model.name}</span>
                  {orderable ? (
                    <span data-price className="block text-sm font-bold text-gold-deep">
                      {formatPrice(price)}
                    </span>
                  ) : (
                    <span data-no-price className="block text-xs text-brown-soft sm:text-sm">
                      המחיר יעודכן בקרוב
                    </span>
                  )}
                </span>
                {!orderable ? null : selected ? (
                  <span
                    aria-hidden="true"
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gold text-sm text-white"
                  >
                    ✓
                  </span>
                ) : (
                  <span aria-hidden="true" className="h-6 w-6 shrink-0 rounded-full border-2 border-line" />
                )}
              </label>
            </div>
          );
        })}
      </div>
    </>
  );
}
