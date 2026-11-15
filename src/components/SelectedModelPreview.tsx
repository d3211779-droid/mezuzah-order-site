import { getModel } from "@/data/catalog";
import ZoomableModelImage from "./ZoomableModelImage";

/** Large photo of the model the customer picked (same image as in the gallery). */
export default function SelectedModelPreview({ modelId }: { modelId: string | null }) {
  const model = getModel(modelId);

  return (
    <div>
      {model ? (
        <ZoomableModelImage
          model={model}
          className="h-72 w-full lg:h-80"
          sizes="(min-width: 1024px) 352px, 92vw"
          preload
        />
      ) : (
        <div className="flex h-72 w-full items-center justify-center rounded-xl border border-dashed border-line bg-white px-6 text-center text-brown-soft lg:h-80">
          בחרו דגם כדי לראות אותו כאן
        </div>
      )}
      {model && <p className="mt-3 text-center text-sm text-brown-soft">תצוגת הדגם שנבחר</p>}
    </div>
  );
}
