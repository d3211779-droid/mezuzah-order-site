import { useCatalog } from "@/lib/catalog/context";
import ZoomableModelImage from "./ZoomableModelImage";

type Props = {
  value: string | null;
  onChange: (id: string) => void;
};

/**
 * Two cards per row on phones and tablets, three on wide desktops.
 * The photo opens a larger view; the name row below it selects the model.
 */
export default function ModelPicker({ value, onChange }: Props) {
  const { models } = useCatalog();
  return (
    <div role="radiogroup" aria-label="דגם" className="grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-3">
      {models.map((model, index) => {
        const selected = value === model.id;
        const inputId = `model-${model.id}`;
        return (
          <div
            key={model.id}
            className="rounded-2xl border-2 border-line bg-paper p-2 transition has-[:checked]:border-gold has-[:checked]:bg-[#fbf6ed] has-[:checked]:shadow-sm has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-gold sm:p-3"
          >
            <input
              id={inputId}
              type="radio"
              name="model"
              value={model.id}
              checked={selected}
              onChange={() => onChange(model.id)}
              className="sr-only"
            />
            <ZoomableModelImage
              model={model}
              sizes="(min-width: 1280px) 220px, (min-width: 640px) 45vw, 46vw"
              preload={index < 2}
            />
            <label
              htmlFor={inputId}
              className="-mx-2 -mb-2 mt-1 flex min-h-12 cursor-pointer items-center justify-between gap-2 px-3 py-2 sm:-mx-3 sm:-mb-3"
            >
              <span className="text-sm font-semibold leading-tight sm:text-base">{model.name}</span>
              {selected ? (
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
  );
}
