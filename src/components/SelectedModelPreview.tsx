import { getColor, getModel } from "@/data/catalog";
import type { OrderValues } from "@/lib/validation";
import ZoomableModelImage from "./ZoomableModelImage";

/**
 * Large live preview of the chosen model. It is the same photo as in the gallery,
 * recoloured from the customer's body / fill choices (colours come from the catalog).
 */
export default function SelectedModelPreview({ values }: { values: OrderValues }) {
  const model = getModel(values.modelId);
  const tint = {
    bodyHex: getColor(values.colorId)?.hex ?? null,
    fillHex: values.fillId === "single" ? (getColor(values.fillColorId)?.hex ?? null) : null,
  };

  return (
    <div>
      {model ? (
        <ZoomableModelImage
          model={model}
          tint={tint}
          className="h-80 w-full lg:h-[22rem]"
          sizes="(min-width: 1024px) 352px, 92vw"
          preload
        />
      ) : (
        <div className="flex h-80 w-full items-center justify-center rounded-xl border border-dashed border-line bg-white px-6 text-center text-brown-soft lg:h-[22rem]">
          בחרו דגם כדי לראות אותו כאן
        </div>
      )}
      {model && (
        <p className="mt-3 text-center text-sm text-brown-soft">
          תצוגת הדגם שנבחר
          <span className="block text-xs">ההדמיה להמחשה בלבד</span>
        </p>
      )}
    </div>
  );
}
