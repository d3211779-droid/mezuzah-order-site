import { fills, patterns, type PatternId } from "@/data/catalog";
import type { OrderValues } from "@/lib/validation";
import ColorPicker from "./ColorPicker";

type FillValues = Pick<OrderValues, "fillId" | "fillColorId" | "fillColor2Id" | "patternId">;

type Props = {
  values: FillValues;
  onChange: (patch: Partial<FillValues>) => void;
};

const SWATCH: Record<PatternId, string> = {
  stripes: "repeating-linear-gradient(45deg, #3c3028 0 3px, #e7d6b6 3px 7px)",
  dots: "radial-gradient(#b28b49 2px, #3c3028 2.5px) 0 0 / 8px 8px",
  grid: "linear-gradient(#e7d6b6 1px, transparent 1px) 0 0 / 8px 8px, linear-gradient(90deg, #e7d6b6 1px, #3c3028 1px) 0 0 / 8px 8px",
};

function SubHeading({ children }: { children: string }) {
  return <h3 className="mb-3 mt-6 font-semibold">{children}</h3>;
}

export default function FillPicker({ values, onChange }: Props) {
  return (
    <div>
      <div role="radiogroup" aria-label="סוג מילוי" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
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

      {(values.fillId === "single" || values.fillId === "double") && (
        <>
          <SubHeading>{values.fillId === "single" ? "צבע המילוי" : "צבע מילוי ראשון"}</SubHeading>
          <ColorPicker
            name="fillColor"
            label="צבע מילוי"
            value={values.fillColorId}
            onChange={(id) => onChange({ fillColorId: id })}
          />
        </>
      )}

      {values.fillId === "double" && (
        <>
          <SubHeading>צבע מילוי שני</SubHeading>
          <ColorPicker
            name="fillColor2"
            label="צבע מילוי שני"
            value={values.fillColor2Id}
            onChange={(id) => onChange({ fillColor2Id: id })}
          />
        </>
      )}

      {values.fillId === "pattern" && (
        <>
          <SubHeading>בחרו דוגמה</SubHeading>
          <div role="radiogroup" aria-label="דוגמה" className="grid grid-cols-3 gap-3">
            {patterns.map((p) => (
              <label key={p.id} className="block cursor-pointer">
                <input
                  type="radio"
                  name="pattern"
                  value={p.id}
                  checked={values.patternId === p.id}
                  onChange={() => onChange({ patternId: p.id })}
                  className="peer sr-only"
                />
                <span className="flex min-h-28 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-line bg-paper p-3 transition peer-checked:border-gold peer-checked:bg-[#fbf6ed] peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-gold">
                  <span
                    className="h-12 w-12 rounded-lg border border-[#d7cec0]"
                    style={{ background: SWATCH[p.id] }}
                  />
                  <span className="text-sm font-medium">{p.name}</span>
                </span>
              </label>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
