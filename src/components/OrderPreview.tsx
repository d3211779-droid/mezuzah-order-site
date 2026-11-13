import { getColor, getFill, getModel } from "@/data/catalog";
import type { OrderValues } from "@/lib/validation";
import MezuzahPreview from "./MezuzahPreview";

/** Binds the preview illustration to the current order values. */
export default function OrderPreview({ values }: { values: OrderValues }) {
  return (
    <MezuzahPreview
      model={getModel(values.modelId)?.glyph ?? null}
      colorHex={getColor(values.colorId)?.hex ?? null}
      fill={getFill(values.fillId).id}
      fillHex={getColor(values.fillColorId)?.hex ?? null}
      text={values.personalText}
    />
  );
}
