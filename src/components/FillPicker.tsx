import { fills } from "@/data/catalog";
import type { OrderValues } from "@/lib/validation";
import ColorPicker from "./ColorPicker";

type FillValues = Pick<OrderValues, "fillId" | "fillColorId">;

type Props = {
  values: FillValues;
  onChange: (patch: Partial<FillValues>) => void;
};

export default function FillPicker({ values, onChange }: Props) {
  return (
    <div>
      <div role="radiogroup" aria-label="סוג מילוי" className="grid grid-cols-2 gap-3">
        {fills.map((fill) => (
          <label key={fill.id} className="block cursor-pointer">
            <input
              type="radio"
              name="fill"
              value={fill.id}
              checked={values.fillId === fill.id}
              onChange={() => onChange({ fillId: fill.id })}
              className="peer sr-only"
            />
            <span className="flex min-h-20 flex-col justify-center rounded-2xl border-2 border-line bg-paper px-4 py-3 transition peer-checked:border-gold peer-checked:bg-[#fbf6ed] peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-gold hover:border-[#cdba99]">
              <span className="font-semibold">{fill.name}</span>
              <span className="text-xs text-brown-soft">{fill.description}</span>
            </span>
          </label>
        ))}
      </div>

      {values.fillId === "single" && (
        <>
          <h3 className="mb-3 mt-6 font-semibold">צבע המילוי</h3>
          <ColorPicker
            name="fillColor"
            label="צבע מילוי"
            value={values.fillColorId}
            onChange={(id) => onChange({ fillColorId: id })}
          />
        </>
      )}
    </div>
  );
}
