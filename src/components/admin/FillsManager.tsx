"use client";

import { updateFill } from "@/app/admin/catalog-actions";
import type { AdminFill } from "@/lib/admin/catalog";
import { ErrorLine, Toggle, useRun } from "./catalog-ui";

function FillCard({ fill }: { fill: AdminFill }) {
  const { pending, error, run } = useRun();
  return (
    <li
      data-fill-card
      className={`rounded-2xl border bg-white p-5 shadow-sm ${fill.available ? "border-line" : "border-dashed border-[#cfc6b8] bg-[#faf7f2]"}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-lg font-bold">{fill.name}</p>
          {fill.description && <p className="text-sm text-brown-soft">{fill.description}</p>}
        </div>
        <Toggle
          checked={fill.available}
          disabled={pending}
          onLabel="פעיל"
          offLabel="מושבת"
          onChange={(available) => run(() => updateFill(fill.id, available))}
        />
      </div>
      {error && (
        <div className="mt-2">
          <ErrorLine>{error}</ErrorLine>
        </div>
      )}
    </li>
  );
}

export default function FillsManager({ fills }: { fills: AdminFill[] }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-brown-soft">
        סוגי המילוי קבועים: ללא מילוי וצבע אחד. אפשר להפעיל או להשבית כל אחד מהם, אבל חייב להישאר לפחות אחד פעיל. סוג מושבת לא
        מוצג ללקוחות.
      </p>
      <ul className="grid gap-4 sm:grid-cols-2">
        {fills.map((f) => (
          <FillCard key={f.id} fill={f} />
        ))}
      </ul>
    </div>
  );
}
