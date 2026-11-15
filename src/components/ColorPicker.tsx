import { useCatalog } from "@/lib/catalog/context";

type Props = {
  name: string;
  label: string;
  value: string | null;
  onChange: (id: string) => void;
};

/** Large colour circles. The catalog only contains colours that are currently available. */
export default function ColorPicker({ name, label, value, onChange }: Props) {
  const { colors } = useCatalog();
  return (
    <div role="radiogroup" aria-label={label} className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-7">
      {colors.map((color) => {
        const selected = value === color.id;
        return (
          <label key={color.id} className="block cursor-pointer">
            <input
              type="radio"
              name={name}
              value={color.id}
              checked={selected}
              onChange={() => onChange(color.id)}
              className="peer sr-only"
            />
            <span className="flex min-h-28 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-line bg-paper p-3 text-center transition peer-checked:border-gold peer-checked:bg-[#fbf6ed] peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-gold">
              <span
                className={`h-12 w-12 rounded-full border-2 ${
                  selected ? "border-gold ring-2 ring-gold-soft" : "border-[#d7cec0]"
                }`}
                style={{ backgroundColor: color.hex }}
              />
              <span className="text-sm font-medium">{color.name}</span>
            </span>
          </label>
        );
      })}
    </div>
  );
}
