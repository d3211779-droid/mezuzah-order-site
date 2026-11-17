"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { useCart } from "@/lib/cart/context";
import { resolveCart, type ResolvedLine } from "@/lib/cart/resolve";
import { useCatalog } from "@/lib/catalog/context";
import { formatPrice } from "@/lib/money";
import { submitCartOrder } from "@/lib/orders/submit";
import {
  CUSTOMER_FIELD_ORDER,
  MAX_NOTE,
  validateCustomer,
  type CustomerFieldKey,
  type CustomerValues,
} from "@/lib/validation";
import { ItemThumb } from "./CartItemParts";
import ConfirmationScreen from "./ConfirmationScreen";

const inputClass = (invalid: boolean) =>
  `w-full min-h-12 rounded-xl border bg-paper px-4 py-3 text-base outline-none transition focus:border-gold focus:ring-2 focus:ring-gold-soft ${
    invalid ? "border-error" : "border-[#dccfbd]"
  }`;

const PRICE_CHANGED_TEXT =
  "המחיר של אחד הפריטים בסל עודכן. עדכנו עבורך את הסל – אנא בדקו את הסכום לפני השליחה.";

type Confirmed = { orderNumber: string; totalAgorot: number; items: ResolvedLine[]; customerName: string };

export default function CheckoutView() {
  const cart = useCart();
  const catalog = useCatalog();
  const router = useRouter();
  const [values, setValues] = useState<CustomerValues>({ fullName: "", phone: "", note: "" });
  const [touched, setTouched] = useState<Partial<Record<CustomerFieldKey, boolean>>>({});
  const [attempted, setAttempted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ kind: "price" | "unavailable" | "failed"; text: string } | null>(null);
  const [confirmed, setConfirmed] = useState<Confirmed | null>(null);
  // One token per distinct order attempt: a double click or a retry after a network error
  // returns the order that was already saved instead of creating a second one.
  const attempt = useRef<{ signature: string; token: string } | null>(null);
  // Synchronous guard: a second click in the same instant must not send a second request.
  const inFlight = useRef(false);

  // Right after a successful order the cart is empty on purpose - show the confirmation.
  if (confirmed) return <ConfirmationScreen {...confirmed} />;

  if (!cart.ready) {
    return (
      <p role="status" className="py-16 text-center text-brown-soft">
        טוען את הסל…
      </p>
    );
  }

  if (cart.lines.length === 0) {
    return (
      <div data-checkout-empty className="mx-auto max-w-md rounded-3xl border border-line bg-white p-8 text-center shadow-sm">
        <h2 className="text-xl font-bold">הסל שלכם ריק</h2>
        <p className="mt-2 text-brown-soft">כדי להזמין, הוסיפו קודם מזוזה לסל.</p>
        <Link
          href="/"
          className="mt-6 inline-flex min-h-12 items-center justify-center rounded-2xl bg-gold px-8 font-bold text-white transition hover:bg-[#9c7a3e]"
        >
          לבחירת מזוזה
        </Link>
      </div>
    );
  }

  const { items, totalAgorot, hasProblems } = resolveCart(cart.lines, catalog);
  const errors = validateCustomer(values);
  const shown = (key: CustomerFieldKey) => (attempted || touched[key] ? errors[key] : undefined);
  const update = <K extends keyof CustomerValues>(key: K, value: CustomerValues[K]) => setValues((v) => ({ ...v, [key]: value }));
  const blur = (key: CustomerFieldKey) => setTouched((t) => ({ ...t, [key]: true }));

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (inFlight.current || saving || hasProblems) return;
    setAttempted(true);
    setNotice(null);

    const firstInvalid = CUSTOMER_FIELD_ORDER.find((key) => errors[key]);
    if (firstInvalid) {
      const el = document.getElementById(firstInvalid);
      el?.scrollIntoView({ block: "center", behavior: "smooth" });
      el?.focus({ preventScroll: true });
      return;
    }

    // Only ids, text and quantity are sent. The database reads the prices itself; the total below is
    // just "what the customer saw" so the database can refuse the order if it is no longer true.
    const sendItems = items.map((i) => ({
      modelId: i.line.modelId,
      bodyColorId: i.line.bodyColorId,
      fillType: i.line.fillType,
      fillColorId: i.line.fillColorId,
      personalText: i.line.personalText,
      quantity: i.line.quantity,
    }));
    const signature = JSON.stringify([sendItems, values.fullName.trim(), values.phone.trim(), values.note.trim(), totalAgorot]);
    if (attempt.current?.signature !== signature) attempt.current = { signature, token: crypto.randomUUID() };

    inFlight.current = true;
    setSaving(true);
    const result = await submitCartOrder(sendItems, values, totalAgorot, attempt.current.token);
    inFlight.current = false;
    setSaving(false);

    if (result.ok) {
      // The cart is emptied only now, after the order was really saved.
      setConfirmed({ orderNumber: result.orderNumber, totalAgorot: result.totalAgorot, items, customerName: values.fullName });
      cart.clear();
      return;
    }
    if (result.reason === "price_changed") {
      // Nothing was saved. Reload the live prices; the customer reviews the new total and sends again.
      setNotice({ kind: "price", text: PRICE_CHANGED_TEXT });
      router.refresh();
    } else if (result.reason === "unavailable") {
      setNotice({ kind: "unavailable", text: "אחד הפריטים בסל כבר לא זמין. עדכנו את הסל לפני השליחה." });
      router.refresh();
    } else {
      setNotice({ kind: "failed", text: "לא הצלחנו לשמור את ההזמנה. נסו שוב." });
    }
    requestAnimationFrame(() => document.getElementById("checkout-notice")?.scrollIntoView({ block: "center", behavior: "smooth" }));
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start">
      <div className="space-y-6">
        {notice && (
          <p
            id="checkout-notice"
            role="alert"
            data-checkout-notice={notice.kind}
            className="rounded-2xl border border-gold bg-[#fbf6ed] p-4 font-medium text-brown"
          >
            {notice.text}
          </p>
        )}

        {hasProblems && (
          <p role="alert" className="rounded-2xl border border-error/50 bg-[#fbeceb] p-4 text-sm font-medium text-error">
            יש בסל פריטים שאינם זמינים יותר.{" "}
            <Link href="/cart" className="underline underline-offset-4">
              חזרה לסל להסרתם
            </Link>
          </p>
        )}

        <section aria-labelledby="details-title" className="rounded-3xl border border-line bg-white p-4 shadow-sm sm:p-5 md:p-7">
          <h2 id="details-title" className="mb-5 text-2xl font-bold">
            פרטים ליצירת קשר
          </h2>
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
                הערה להזמנה
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
        </section>
      </div>

      <aside aria-label="סיכום הסל" className="rounded-3xl bg-brown p-5 text-white md:p-6 lg:sticky lg:top-16">
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <h2 className="text-lg font-bold">סיכום ההזמנה</h2>
          <Link href="/cart" className="text-sm font-semibold text-[#e7d6b6] underline underline-offset-4">
            עריכת הסל
          </Link>
        </div>
        <ul className="divide-y divide-white/15">
          {items.map((item) => (
            <li key={item.line.key} data-checkout-item className="flex items-center gap-3 py-3 first:pt-0">
              <div className="rounded-lg bg-white">
                <ItemThumb item={item} className="h-14 w-14" />
              </div>
              <div className="min-w-0 flex-1 text-sm">
                <p className="font-bold">{item.model?.name ?? "הדגם"}</p>
                <p className="text-xs text-[#d9c39a]">
                  {item.bodyColor?.name}
                  {item.line.fillType === "single" && item.fillColor ? ` · מילוי ${item.fillColor.name}` : ""}
                  {item.line.personalText ? ` · ${item.line.personalText}` : ""}
                </p>
              </div>
              <div className="shrink-0 text-left text-sm">
                <p className="text-xs text-[#d9c39a]">× {item.line.quantity}</p>
                <p className="font-bold">{formatPrice(item.lineTotalAgorot ?? 0)}</p>
              </div>
            </li>
          ))}
        </ul>

        <p className="mt-2 flex items-baseline justify-between gap-3 border-t border-white/20 pt-4">
          <span className="font-bold">סה״כ להזמנה</span>
          <span>
            <strong data-checkout-total className="text-2xl">
              {formatPrice(totalAgorot)}
            </strong>{" "}
            <span className="text-xs text-[#d9c39a]">כולל מע״מ</span>
          </span>
        </p>
        <p className="mt-2 text-xs text-[#d9c39a]">אין תשלום באתר. ניצור איתך קשר לסגירת התשלום והאספקה.</p>

        {attempted && Object.keys(errors).length > 0 && (
          <p role="alert" className="mt-4 rounded-xl bg-white/10 p-3 text-sm">
            יש להשלים את השדות המסומנים לפני השליחה.
          </p>
        )}

        <button
          type="submit"
          disabled={saving || hasProblems}
          className="mt-5 min-h-14 w-full rounded-2xl bg-gold px-6 text-lg font-bold text-white transition hover:bg-[#9c7a3e] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "שולח…" : "שלח הזמנה"}
        </button>
      </aside>
    </form>
  );
}
