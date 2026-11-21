import { useCatalog } from "@/lib/catalog/context";
import { parchmentInfo } from "@/lib/catalog/parchment";
import { formatPrice } from "@/lib/money";

type Props = {
  /** null = no parchment. */
  value: string | null;
  onChange: (id: string | null) => void;
};

const optionClass =
  "flex min-h-20 flex-col justify-center rounded-2xl border-2 border-line bg-paper px-4 py-3 transition peer-checked:border-gold peer-checked:bg-[#fbf6ed] peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-gold hover:border-[#cdba99]";

/**
 * "No parchment" plus one option per available parchment (the catalog already holds them in the
 * admin's order). Names come from the database exactly as typed - nothing is hard-coded here.
 */
export default function ParchmentPicker({ value, onChange }: Props) {
  const { parchments, getParchment } = useCatalog();
  const selected = getParchment(value);

  return (
    <div>
      <div role="radiogroup" aria-label="קלף" className="grid gap-3 sm:grid-cols-2">
        <label className="block cursor-pointer">
          <input
            type="radio"
            name="parchment"
            value="none"
            checked={value === null}
            onChange={() => onChange(null)}
            className="peer sr-only"
          />
          <span className={optionClass}>
            <span className="font-semibold">ללא קלף</span>
          </span>
        </label>

        {parchments.map((p) => (
          <label key={p.id} className="block cursor-pointer">
            <input
              type="radio"
              name="parchment"
              value={p.id}
              checked={value === p.id}
              onChange={() => onChange(p.id)}
              className="peer sr-only"
            />
            <span data-parchment-option className={optionClass}>
              <span className="font-semibold">{p.name}</span>
              <span className="text-sm font-bold text-gold-deep">
                +{formatPrice(p.priceAgorot)} <span className="text-xs font-normal text-brown-soft">כולל מע״מ</span>
              </span>
            </span>
          </label>
        ))}
      </div>

      {selected && (
        <div data-parchment-info className="mt-4 rounded-xl bg-[#fbf6ed] px-4 py-3 text-sm text-brown">
          <p>{parchmentInfo(selected)}</p>
          {selected.note && <p className="mt-1 text-brown-soft">{selected.note}</p>}
        </div>
      )}
    </div>
  );
}
