"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import type { ResolvedLine } from "@/lib/cart/resolve";
import { useCatalog } from "@/lib/catalog/context";
import { formatPrice } from "@/lib/money";
import { ItemDetails, ItemThumb } from "./CartItemParts";

type Props = {
  customerName: string;
  orderNumber: string;
  /** The total saved by the database (the real one). */
  totalAgorot: number;
  /** The items as they were in the cart at the moment the order was sent. */
  items: ResolvedLine[];
};

export default function ConfirmationScreen({ customerName, orderNumber, totalAgorot, items }: Props) {
  const firstName = customerName.trim().split(/\s+/)[0];
  const { confirmationMessage } = useCatalog().settings;
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    window.scrollTo({ top: 0 });
    ref.current?.focus();
  }, []);

  return (
    <section
      id="confirmation"
      ref={ref}
      tabIndex={-1}
      aria-labelledby="confirmation-title"
      className="mx-auto max-w-xl pb-16 outline-none"
    >
      <div className="rounded-3xl border border-line bg-white p-6 text-center shadow-sm md:p-8">
        <div
          aria-hidden="true"
          className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gold-soft text-3xl text-gold-deep"
        >
          ✓
        </div>
        <h2 id="confirmation-title" className="text-2xl font-bold md:text-3xl">
          ההזמנה התקבלה, {firstName}!
        </h2>
        <p className="mt-3 text-lg">
          מספר הזמנה: <strong dir="ltr">{orderNumber}</strong>
        </p>
        <p className="mt-2 whitespace-pre-line text-brown-soft">{confirmationMessage}</p>

        <div className="mt-6 rounded-2xl bg-cream p-4 text-right">
          <p className="mb-3 text-sm font-medium text-gold-deep">סיכום ההזמנה</p>
          <ul className="divide-y divide-line">
            {items.map((item) => (
              <li key={item.line.key} data-confirm-item className="flex gap-3 py-3 first:pt-0 last:pb-0">
                <ItemThumb item={item} className="h-16 w-16" />
                <div className="min-w-0 flex-1">
                  <ItemDetails item={item} />
                  <p className="mt-1 text-sm text-brown-soft">
                    {item.line.quantity} × {formatPrice(item.unitPriceAgorot ?? 0)} ={" "}
                    <strong className="text-brown">{formatPrice(item.lineTotalAgorot ?? 0)}</strong>
                  </p>
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-4 flex items-baseline justify-between gap-3 border-t border-line pt-3">
            <span className="font-bold">סה״כ להזמנה</span>
            <span>
              <strong data-confirm-total className="text-xl">
                {formatPrice(totalAgorot)}
              </strong>{" "}
              <span className="text-sm text-brown-soft">כולל מע״מ</span>
            </span>
          </p>
        </div>

        <Link
          href="/design"
          className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-2xl border-2 border-gold px-6 font-semibold text-gold-deep transition hover:bg-[#fbf6ed] sm:w-auto"
        >
          הזמנה חדשה
        </Link>
      </div>
    </section>
  );
}
