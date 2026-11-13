import { models } from "@/data/catalog";
import ModelImage from "./ModelImage";

type Props = {
  value: string | null;
  onChange: (id: string) => void;
};

/** One card per row on phones, two on tablets, three on wide desktops. */
export default function ModelPicker({ value, onChange }: Props) {
  return (
    <div role="radiogroup" aria-label="דגם" className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {models.map((model, index) => {
        const selected = value === model.id;
        return (
          <label key={model.id} className="block cursor-pointer">
            <input
              type="radio"
              name="model"
              value={model.id}
              checked={selected}
              onChange={() => onChange(model.id)}
              className="peer sr-only"
            />
            <span className="block h-full rounded-2xl border-2 border-line bg-paper p-3 transition peer-checked:border-gold peer-checked:bg-[#fbf6ed] peer-checked:shadow-sm peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-gold hover:border-[#cdba99] sm:p-4">
              <ModelImage model={model} preload={index === 0} />
              <span className="mt-3 flex items-center justify-between gap-3 px-1 pb-1">
                <span className="block text-lg font-semibold">{model.name}</span>
                {selected ? (
                  <span
                    aria-hidden="true"
                    className="flex h-7 shrink-0 items-center rounded-full bg-gold-soft px-3 text-sm font-medium text-gold-deep"
                  >
                    ✓ נבחר
                  </span>
                ) : (
                  <span aria-hidden="true" className="h-6 w-6 shrink-0 rounded-full border-2 border-line" />
                )}
              </span>
            </span>
          </label>
        );
      })}
    </div>
  );
}
