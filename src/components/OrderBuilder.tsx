"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { useCart } from "@/lib/cart/context";
import { MAX_LINES, MAX_QUANTITY } from "@/lib/cart/store";
import { useCatalog } from "@/lib/catalog/context";
import {
  ITEM_FIELD_ORDER,
  validateItem,
  type ItemFieldKey,
  type ItemValues,
} from "@/lib/validation";
import ColorPicker from "./ColorPicker";
import FillPicker from "./FillPicker";
import GoodToKnow from "./GoodToKnow";
import ModelPicker from "./ModelPicker";
import OrderSummary from "./OrderSummary";
import ParchmentPicker from "./ParchmentPicker";
import SectionCard from "./SectionCard";
import SelectedModelPreview from "./SelectedModelPreview";

const initialValues = (defaultFillId: string): ItemValues => ({
  modelId: null,
  colorId: null,
  fillId: defaultFillId,
  fillColorId: null,
  personalText: "",
  parchmentId: null,
});

const FIELD_DOM_ID: Record<ItemFieldKey, string> = {
  model: "section-model",
  color: "section-color",
  fill: "section-fill",
  personalText: "personalText",
  parchment: "section-parchment",
};

const inputClass = (invalid: boolean) =>
  `w-full min-h-12 rounded-xl border bg-paper px-4 py-3 text-base outline-none transition focus:border-gold focus:ring-2 focus:ring-gold-soft ${
    invalid ? "border-error" : "border-[#dccfbd]"
  }`;

/** Confirmation after "add to cart": stays on screen for a while, with a way to the cart. */
function AddedToast({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 10000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      role="status"
      data-added-toast
      className="fixed inset-x-0 bottom-0 z-40 px-3 pb-3 sm:inset-x-auto sm:bottom-4 sm:start-4 sm:w-96 sm:px-0 sm:pb-0"
    >
      <div className="flex items-center gap-3 rounded-2xl bg-brown px-4 py-3 text-white shadow-lg">
        <span aria-hidden="true" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold text-white">
          ✓
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-bold">המזוזה נוספה לסל</p>
          <Link href="/cart" className="text-sm font-semibold text-[#e7d6b6] underline underline-offset-4">
            לסל הקניות
          </Link>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="סגירת ההודעה"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xl text-white/80 hover:bg-white/10"
        >
          ×
        </button>
      </div>
    </div>
  );
}

export default function OrderBuilder() {
  const catalog = useCatalog();
  const cart = useCart();
  const { personalTextMax, personalTextSizeNote } = catalog.settings;
  // "No fill" is the default; if it is switched off in the admin panel, the first available fill is used.
  const defaultFillId = (catalog.fills.find((f) => f.id === "none") ?? catalog.fills[0]).id;
  const [values, setValues] = useState<ItemValues>(() => initialValues(defaultFillId));
  const [touched, setTouched] = useState<Partial<Record<ItemFieldKey, boolean>>>({});
  const [attempted, setAttempted] = useState(false);
  const [addedToast, setAddedToast] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const errors = validateItem(values, catalog);
  const shown = (key: ItemFieldKey) =>
    attempted || touched[key] || (key === "personalText" && values.personalText !== "")
      ? errors[key]
      : undefined;

  const update = <K extends keyof ItemValues>(key: K, value: ItemValues[K]) =>
    setValues((v) => ({ ...v, [key]: value }));
  const blur = (key: ItemFieldKey) => setTouched((t) => ({ ...t, [key]: true }));

  function handleAddToCart(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setAttempted(true);
    setAddError(null);

    const firstInvalid = ITEM_FIELD_ORDER.find((key) => errors[key]);
    if (firstInvalid) {
      const el = document.getElementById(FIELD_DOM_ID[firstInvalid]);
      el?.scrollIntoView({ block: "center", behavior: "smooth" });
      el?.focus({ preventScroll: true });
      return;
    }

    const model = catalog.getModel(values.modelId);
    if (!model || !values.colorId) return;
    const result = cart.add({
      modelId: model.id,
      modelName: model.name,
      bodyColorId: values.colorId,
      fillType: values.fillId === "single" ? "single" : "none",
      fillColorId: values.fillId === "single" ? values.fillColorId : null,
      personalText: values.personalText,
      parchmentId: values.parchmentId,
    });
    if (!result.ok) {
      setAddError(
        result.reason === "max-lines"
          ? `בסל כבר יש ${MAX_LINES} מוצרים שונים. אפשר להסיר פריט, או להמשיך להזמנה.`
          : `אי אפשר להוסיף יותר מ-${MAX_QUANTITY} יחידות מאותה מזוזה.`,
      );
      return;
    }

    // Ready for the next mezuzah: clear the selection, say so, and go back to the top.
    setValues(initialValues(defaultFillId));
    setTouched({});
    setAttempted(false);
    setAddedToast(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const textError = shown("personalText");
  const textLength = values.personalText.length;

  return (
    <form noValidate onSubmit={handleAddToCart} className="px-4 pb-16">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
        <div className="space-y-6">
          <SectionCard
            id="section-model"
            step={1}
            title="בחרו דגם"
            hint="המחיר המוצג הוא המחיר הסופי, כולל מע״מ."
            error={shown("model")}
          >
            <ModelPicker
              value={values.modelId}
              onChange={(id) => {
                update("modelId", id);
                blur("model");
              }}
            />
          </SectionCard>

          <SectionCard id="section-color" step={2} title="בחרו צבע" error={shown("color")}>
            <ColorPicker
              name="color"
              label="צבע"
              value={values.colorId}
              onChange={(id) => {
                update("colorId", id);
                blur("color");
              }}
            />
          </SectionCard>

          <SectionCard id="section-fill" step={3} title="בחרו מילוי" error={shown("fill")}>
            <FillPicker
              values={values}
              onChange={(patch) => setValues((v) => ({ ...v, ...patch }))}
            />
          </SectionCard>

          <SectionCard
            step={4}
            title="טקסט אישי"
            hint="אפשר להוסיף שם או מילה קצרה, באותיות עבריות בלבד. לא חובה."
          >
            <input
              id="personalText"
              type="text"
              dir="rtl"
              autoComplete="off"
              value={values.personalText}
              onChange={(e) => update("personalText", e.target.value)}
              onBlur={() => blur("personalText")}
              placeholder="לדוגמה: כהן"
              aria-label="טקסט אישי"
              aria-invalid={!!textError}
              aria-describedby="personalText-help"
              className={`${inputClass(!!textError)} max-w-44 text-center`}
            />
            <div id="personalText-help" className="mt-2 flex max-w-44 items-start justify-between gap-3 text-sm">
              <span className={textError ? "font-medium text-error" : "text-brown-soft"}>
                {textError ?? "בעברית בלבד"}
              </span>
              <span
                dir="ltr"
                className={textLength > personalTextMax ? "font-medium text-error" : "text-brown-soft"}
              >
                {textLength}/{personalTextMax}
              </span>
            </div>
            <p className="mt-3 text-sm text-brown-soft">{personalTextSizeNote}</p>
          </SectionCard>

          {catalog.parchments.length > 0 && (
            <SectionCard
              id="section-parchment"
              step={5}
              title="האם תרצו להוסיף קלף למזוזה?"
              hint="הקלף הוא תוספת בתשלום, והמחיר שלו מתווסף למחיר המזוזה."
              error={shown("parchment")}
            >
              <ParchmentPicker value={values.parchmentId} onChange={(id) => update("parchmentId", id)} />
            </SectionCard>
          )}

          <GoodToKnow />
        </div>

        <aside className="space-y-4 lg:sticky lg:top-16 lg:max-h-[calc(100vh-5rem)] lg:overflow-y-auto">
          <div className="rounded-3xl border border-line bg-white p-5 shadow-sm">
            <SelectedModelPreview values={values} />
          </div>

          <div className="rounded-3xl bg-brown p-5 text-white md:p-6">
            <h2 className="mb-4 text-lg font-bold">המזוזה שבחרתם</h2>
            <OrderSummary values={values} />

            {attempted && Object.keys(errors).length > 0 && (
              <p role="alert" className="mt-4 rounded-xl bg-white/10 p-3 text-sm">
                יש להשלים את השדות המסומנים לפני ההוספה לסל.
              </p>
            )}

            {addError && (
              <p role="alert" className="mt-4 rounded-xl bg-white/10 p-3 text-sm font-medium">
                {addError}
              </p>
            )}

            <button
              type="submit"
              className="mt-5 min-h-14 w-full rounded-2xl bg-gold px-6 text-lg font-bold text-white transition hover:bg-[#9c7a3e] active:scale-[0.99]"
            >
              הוסף לסל
            </button>
          </div>
        </aside>
      </div>

      {addedToast && <AddedToast onClose={() => setAddedToast(false)} />}
    </form>
  );
}
