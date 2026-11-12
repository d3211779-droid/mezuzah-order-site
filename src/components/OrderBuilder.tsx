"use client";

import { useState, type FormEvent } from "react";
import { makeTempOrderNumber } from "@/lib/orderNumber";
import {
  FIELD_DOM_ID,
  FIELD_ORDER,
  MAX_NOTE,
  MAX_PERSONAL_TEXT,
  validateOrder,
  type FieldKey,
  type OrderValues,
} from "@/lib/validation";
import ColorPicker from "./ColorPicker";
import ConfirmationScreen from "./ConfirmationScreen";
import FillPicker from "./FillPicker";
import OrderPreview from "./OrderPreview";
import ModelPicker from "./ModelPicker";
import OrderSummary from "./OrderSummary";
import SectionCard from "./SectionCard";

const INITIAL: OrderValues = {
  modelId: null,
  colorId: null,
  fillId: "none",
  fillColorId: null,
  fillColor2Id: null,
  patternId: null,
  personalText: "",
  fullName: "",
  phone: "",
  note: "",
};

const inputClass = (invalid: boolean) =>
  `w-full min-h-12 rounded-xl border bg-paper px-4 py-3 text-base outline-none transition focus:border-gold focus:ring-2 focus:ring-gold-soft ${
    invalid ? "border-error" : "border-[#dccfbd]"
  }`;

export default function OrderBuilder() {
  const [values, setValues] = useState<OrderValues>(INITIAL);
  const [touched, setTouched] = useState<Partial<Record<FieldKey, boolean>>>({});
  const [attempted, setAttempted] = useState(false);
  const [submitted, setSubmitted] = useState<{ order: OrderValues; number: string } | null>(null);

  const errors = validateOrder(values);
  const shown = (key: FieldKey) =>
    attempted || touched[key] || (key === "personalText" && values.personalText !== "")
      ? errors[key]
      : undefined;

  const update = <K extends keyof OrderValues>(key: K, value: OrderValues[K]) =>
    setValues((v) => ({ ...v, [key]: value }));
  const blur = (key: FieldKey) => setTouched((t) => ({ ...t, [key]: true }));

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setAttempted(true);

    const firstInvalid = FIELD_ORDER.find((key) => errors[key]);
    if (firstInvalid) {
      const el = document.getElementById(FIELD_DOM_ID[firstInvalid]);
      el?.scrollIntoView({ block: "center", behavior: "smooth" });
      el?.focus({ preventScroll: true });
      return;
    }

    // Temporary number until orders are really saved.
    setSubmitted({ order: { ...values }, number: makeTempOrderNumber() });
    window.scrollTo({ top: 0 });
    requestAnimationFrame(() => document.getElementById("confirmation")?.focus());
  }

  function reset() {
    setValues(INITIAL);
    setTouched({});
    setAttempted(false);
    setSubmitted(null);
    window.scrollTo({ top: 0 });
  }

  if (submitted) return <ConfirmationScreen order={submitted.order} orderNumber={submitted.number} onReset={reset} />;

  const textError = shown("personalText");
  const textLength = values.personalText.length;

  return (
    <form noValidate onSubmit={handleSubmit} className="px-4 pb-16">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
        <div className="space-y-6">
          <SectionCard id="section-model" step={1} title="בחרו דגם" error={shown("model")}>
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
            hint="אפשר להוסיף שם או ברכה קצרה, באותיות עבריות בלבד (אזור הטקסט ברוחב 2.3 ס״מ). לא חובה."
          >
            <input
              id="personalText"
              type="text"
              dir="rtl"
              autoComplete="off"
              value={values.personalText}
              onChange={(e) => update("personalText", e.target.value)}
              onBlur={() => blur("personalText")}
              placeholder="לדוגמה: משפחת כהן"
              aria-label="טקסט אישי"
              aria-invalid={!!textError}
              aria-describedby="personalText-help"
              className={inputClass(!!textError)}
            />
            <div
              id="personalText-help"
              className="mt-2 flex justify-between gap-3 text-sm"
            >
              <span className={textError ? "font-medium text-error" : "text-brown-soft"}>
                {textError ?? `עד ${MAX_PERSONAL_TEXT} תווים, בעברית בלבד`}
              </span>
              <span
                dir="ltr"
                className={textLength > MAX_PERSONAL_TEXT ? "font-medium text-error" : "text-brown-soft"}
              >
                {textLength}/{MAX_PERSONAL_TEXT}
              </span>
            </div>
          </SectionCard>

          <SectionCard step={5} title="פרטים ליצירת קשר">
            <div className="space-y-5">
              <div>
                <label htmlFor="fullName" className="mb-2 block font-medium">
                  שם מלא <span className="text-error">*</span>
                </label>
                <input
                  id="fullName"
                  type="text"
                  autoComplete="name"
                  value={values.fullName}
                  onChange={(e) => update("fullName", e.target.value)}
                  onBlur={() => blur("fullName")}
                  aria-invalid={!!shown("fullName")}
                  aria-describedby={shown("fullName") ? "fullName-error" : undefined}
                  className={inputClass(!!shown("fullName"))}
                />
                {shown("fullName") && (
                  <p id="fullName-error" role="alert" className="mt-2 text-sm font-medium text-error">
                    {shown("fullName")}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="phone" className="mb-2 block font-medium">
                  טלפון <span className="text-error">*</span>
                </label>
                <input
                  id="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  dir="ltr"
                  placeholder="050-1234567"
                  value={values.phone}
                  onChange={(e) => update("phone", e.target.value)}
                  onBlur={() => blur("phone")}
                  aria-invalid={!!shown("phone")}
                  aria-describedby={shown("phone") ? "phone-error" : undefined}
                  className={`${inputClass(!!shown("phone"))} text-right`}
                />
                {shown("phone") && (
                  <p id="phone-error" role="alert" className="mt-2 text-sm font-medium text-error">
                    {shown("phone")}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="note" className="mb-2 block font-medium">
                  הערה חופשית
                </label>
                <textarea
                  id="note"
                  rows={3}
                  maxLength={MAX_NOTE}
                  value={values.note}
                  onChange={(e) => update("note", e.target.value)}
                  className={inputClass(false)}
                />
              </div>
            </div>
          </SectionCard>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto">
          <div className="rounded-3xl border border-line bg-white p-5 shadow-sm">
            <OrderPreview values={values} />
            <p className="mt-2 text-center text-xs text-brown-soft">תצוגה להמחשה בלבד</p>
          </div>

          <div className="rounded-3xl bg-brown p-5 text-white md:p-6">
            <h2 className="mb-4 text-lg font-bold">סיכום הזמנה</h2>
            <OrderSummary values={values} />

            {attempted && Object.keys(errors).length > 0 && (
              <p role="alert" className="mt-4 rounded-xl bg-white/10 p-3 text-sm">
                יש להשלים את השדות המסומנים לפני השליחה.
              </p>
            )}

            <button
              type="submit"
              className="mt-5 min-h-14 w-full rounded-2xl bg-gold px-6 text-lg font-bold text-white transition hover:bg-[#9c7a3e] active:scale-[0.99]"
            >
              שלח הזמנה
            </button>
          </div>
        </aside>
      </div>
    </form>
  );
}
