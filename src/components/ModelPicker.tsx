import { models } from "@/data/catalog";
import { ModelIcon } from "./MezuzahPreview";

type Props = {
  value: string | null;
  onChange: (id: string) => void;
};

export default function ModelPicker({ value, onChange }: Props) {
  return (
    <div role="radiogroup" aria-label="דגם" className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {models.map((model) => (
        <label key={model.id} className="block cursor-pointer">
          <input
            type="radio"
            name="model"
            value={model.id}
            checked={value === model.id}
            onChange={() => onChange(model.id)}
            className="peer sr-only"
          />
          <span className="flex h-full flex-col items-center gap-3 rounded-2xl border-2 border-line bg-paper px-3 py-5 text-center transition peer-checked:border-gold peer-checked:bg-[#fbf6ed] peer-checked:shadow-md peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-gold hover:border-[#cdba99]">
            <ModelIcon model={model.id} className="h-16 w-14 shrink-0" />
            <span className="block">
              <span className="block text-lg font-semibold">{model.name}</span>
              <span className="block text-sm text-brown-soft">{model.description}</span>
              {value === model.id && (
                <span className="mt-1 block text-sm font-medium text-gold-deep">✓ נבחר</span>
              )}
            </span>
          </span>
        </label>
      ))}
    </div>
  );
}
