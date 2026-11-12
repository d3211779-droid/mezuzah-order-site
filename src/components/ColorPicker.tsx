import { colors } from "@/data/catalog";

type Props = {
  name: string;
  label: string;
  value: string | null;
  onChange: (id: string) => void;
};

/** Large colour circles. Unavailable colours are greyed out and not selectable. */
export default function ColorPicker({ name, label, value, onChange }: Props) {
  return (
    <div role="radiogroup" aria-label={label} className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-7">
      {colors.map((color) => {
        const selected = value === color.id;
        return (
          <label
            key={color.id}
            className={`block ${color.available ? "cursor-pointer" : "cursor-not-allowed"}`}
          >
            <input
              type="radio"
              name={name}
              value={color.id}
              checked={selected}
              disabled={!color.available}
              onChange={() => onChange(color.id)}
              className="peer sr-only"
            />
            <span
              className={`flex min-h-28 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-line p-3 text-center transition peer-checked:border-gold peer-checked:bg-[#fbf6ed] peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-gold ${
                color.available ? "bg-paper" : "bg-[#efedea] text-[#8a8580]"
              }`}
            >
              <span
                className={`h-12 w-12 rounded-full border-2 ${
                  selected ? "border-gold ring-2 ring-gold-soft" : "border-[#d7cec0]"
                } ${color.available ? "" : "grayscale"}`}
                style={{ backgroundColor: color.hex }}
              />
              <span className="text-sm font-medium">{color.name}</span>
              {!color.available && <span className="text-xs">לא זמין</span>}
            </span>
          </label>
        );
      })}
    </div>
  );
}
