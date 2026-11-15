"use client";

import { useState, useTransition } from "react";
import { updateOrderStatus } from "@/app/admin/actions";
import { ORDER_STATUSES, statusInfo, type OrderStatus } from "@/lib/admin/orders";

/** Big, colour-coded status control. Saves immediately when changed. */
export default function StatusSelect({ orderId, status }: { orderId: string; status: OrderStatus }) {
  const [value, setValue] = useState<OrderStatus>(status);
  const [failed, setFailed] = useState(false);
  const [pending, startTransition] = useTransition();
  const info = statusInfo(value);

  function onChange(next: OrderStatus) {
    const previous = value;
    setValue(next);
    setFailed(false);
    startTransition(async () => {
      const result = await updateOrderStatus(orderId, next);
      if (!result.ok) {
        setValue(previous);
        setFailed(true);
      }
    });
  }

  return (
    <div>
      <label className="sr-only" htmlFor={`status-${orderId}`}>
        סטטוס הזמנה
      </label>
      <select
        id={`status-${orderId}`}
        value={value}
        disabled={pending}
        onChange={(e) => onChange(e.target.value as OrderStatus)}
        className={`min-h-12 w-full cursor-pointer rounded-xl border-2 px-4 text-base font-bold outline-none focus:ring-2 focus:ring-gold-soft disabled:cursor-wait disabled:opacity-60 ${info.badge}`}
      >
        {ORDER_STATUSES.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
      {failed && (
        <p role="alert" className="mt-1 text-sm font-medium text-error">
          לא הצלחנו לעדכן את הסטטוס. נסו שוב.
        </p>
      )}
    </div>
  );
}
