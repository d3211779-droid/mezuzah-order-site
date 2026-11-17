"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart/context";
import { PROBLEM_TEXT, resolveCart, type ResolvedLine } from "@/lib/cart/resolve";
import { MAX_LINES, MAX_QUANTITY } from "@/lib/cart/store";
import { useCatalog } from "@/lib/catalog/context";
import { formatPrice } from "@/lib/money";
import { ItemDetails, ItemThumb } from "./CartItemParts";

const stepButton =
  "flex h-11 w-11 items-center justify-center rounded-xl border border-line bg-white text-xl font-bold transition hover:border-gold disabled:cursor-not-allowed disabled:opacity-40";

function CartItemCard({ item }: { item: ResolvedLine }) {
  const cart = useCart();
  const { line } = item;
  const name = item.model?.name ?? (line.modelName || "הדגם");

  return (
    <li data-cart-item className={`rounded-2xl border bg-white p-4 shadow-sm ${item.problem ? "border-error/50" : "border-line"}`}>
      <div className="flex gap-4">
        <ItemThumb item={item} />
        <div className="min-w-0 flex-1">
          <ItemDetails item={item} />
          {item.unitPriceAgorot !== null && (
            <p className="mt-2 text-sm text-brown-soft">
              מחיר ליחידה: <strong data-unit-price className="text-brown">{formatPrice(item.unitPriceAgorot)}</strong>
            </p>
          )}
        </div>
      </div>

      {item.problem ? (
        <p role="alert" data-item-problem className="mt-3 rounded-xl bg-[#fbeceb] px-3 py-2 text-sm font-medium text-error">
          {PROBLEM_TEXT[item.problem]} יש להסיר אותו כדי להמשיך.
        </p>
      ) : (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2" role="group" aria-label={`כמות – ${name}`}>
            <button
              type="button"
              aria-label="הקטנת כמות"
              disabled={line.quantity <= 1}
              onClick={() => cart.setQuantity(line.key, line.quantity - 1)}
              className={stepButton}
            >
              −
            </button>
            <span data-quantity aria-live="polite" className="min-w-10 text-center text-lg font-bold tabular-nums">
              {line.quantity}
            </span>
            <button
              type="button"
              aria-label="הגדלת כמות"
              disabled={line.quantity >= MAX_QUANTITY}
              onClick={() => cart.setQuantity(line.key, line.quantity + 1)}
              className={stepButton}
            >
              +
            </button>
          </div>
          <p className="text-sm text-brown-soft">
            סה״כ לפריט:{" "}
            <strong data-line-total className="text-lg text-brown">
              {formatPrice(item.lineTotalAgorot ?? 0)}
            </strong>
          </p>
        </div>
      )}
      {line.quantity >= MAX_QUANTITY && !item.problem && (
        <p className="mt-2 text-xs text-brown-soft">הגעתם למקסימום של {MAX_QUANTITY} יחידות מאותה מזוזה.</p>
      )}

      <div className="mt-3 border-t border-line pt-2">
        <button
          type="button"
          onClick={() => cart.remove(line.key)}
          className="inline-flex min-h-11 items-center rounded-lg px-1 text-sm font-semibold text-error underline-offset-4 hover:underline"
        >
          הסר מהסל
        </button>
      </div>
    </li>
  );
}

export default function CartView() {
  const cart = useCart();
  const catalog = useCatalog();

  if (!cart.ready) {
    return (
      <p role="status" className="py-16 text-center text-brown-soft">
        טוען את הסל…
      </p>
    );
  }

  if (cart.lines.length === 0) {
    return (
      <div data-cart-empty className="mx-auto max-w-md rounded-3xl border border-line bg-white p-8 text-center shadow-sm">
        <h2 className="text-xl font-bold">הסל שלכם ריק</h2>
        <p className="mt-2 text-brown-soft">בחרו דגם, צבע ומילוי והוסיפו את המזוזה לסל.</p>
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
  const units = cart.lines.reduce((sum, l) => sum + l.quantity, 0);

  return (
    <div className="grid gap-6 pb-28 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start lg:pb-0">
      <div>
        <ul className="space-y-4">
          {items.map((item) => (
            <CartItemCard key={item.line.key} item={item} />
          ))}
        </ul>
        <Link href="/" className="mt-4 inline-flex min-h-11 items-center font-semibold text-gold-deep">
          + הוספת מזוזה נוספת
        </Link>
        <p className="text-xs text-brown-soft">
          עד {MAX_LINES} מוצרים שונים בסל ו-{MAX_QUANTITY} יחידות מכל מוצר.
        </p>
      </div>

      <section
        aria-label="סיכום ההזמנה"
        className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-white p-4 shadow-[0_-4px_16px_rgba(60,48,40,0.08)] lg:sticky lg:top-16 lg:rounded-3xl lg:border lg:p-6 lg:shadow-sm"
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 lg:block">
          <div>
            <p className="text-sm text-brown-soft">
              סה״כ להזמנה <span className="hidden lg:inline">({units} יחידות)</span>
            </p>
            <p className="flex flex-wrap items-baseline gap-x-2">
              <strong data-cart-total className="text-2xl font-bold">
                {formatPrice(totalAgorot)}
              </strong>
              <span className="text-sm text-brown-soft">כולל מע״מ</span>
            </p>
          </div>
          {hasProblems ? (
            <div className="lg:mt-4">
              <p role="alert" className="mb-2 hidden text-sm font-medium text-error lg:block">
                יש להסיר את הפריטים שאינם זמינים כדי להמשיך.
              </p>
              <span
                aria-disabled="true"
                className="flex min-h-14 shrink-0 whitespace-nowrap cursor-not-allowed items-center justify-center rounded-2xl bg-gold/50 px-6 text-lg font-bold text-white"
              >
                המשך להזמנה
              </span>
            </div>
          ) : (
            <Link
              href="/checkout"
              className="flex min-h-14 shrink-0 whitespace-nowrap items-center justify-center rounded-2xl bg-gold px-6 text-lg font-bold text-white transition hover:bg-[#9c7a3e] lg:mt-4"
            >
              המשך להזמנה
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}
