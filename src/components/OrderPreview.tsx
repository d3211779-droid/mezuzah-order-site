import { getColor, getFill, getModel, getPattern } from "@/data/catalog";
import type { OrderValues } from "@/lib/validation";
import MezuzahPreview from "./MezuzahPreview";

/** Binds the preview illustration to the current order values. */
export default function OrderPreview({ values }: { values: OrderValues }) {
  return (
    <MezuzahPreview
      model={getModel(values.modelId)?.id ?? null}
      colorHex={getColor(values.colorId)?.hex ?? null}
      fill={getFill(values.fillId).id}
      fillHex={getColor(values.fillColorId)?.hex ?? null}
      fillHex2={getColor(values.fillColor2Id)?.hex ?? null}
      patternId={getPattern(values.patternId)?.id ?? null}
      text={values.personalText}
    />
  );
}
