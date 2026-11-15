"use client";

import { updateFill } from "@/app/admin/catalog-actions";
import type { AdminFill } from "@/lib/admin/catalog";
import { ErrorLine, Toggle, useRun } from "./catalog-ui";

function FillRow({ fill }: { fill: AdminFill }) {
  const { pending, error, run } = useRun();
  return (
    <li className="rounded-2xl border border-line bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-lg font-bold">{fill.name}</span>
        <Toggle
          checked={fill.available}
          disabled={pending}
          onLabel="זמין"
          offLabel="לא זמין"
          onChange={(available) => run(() => updateFill(fill.id, available))}
        />
      </div>
      {error && <div className="mt-2"><ErrorLine>{error}</ErrorLine></div>}
    </li>
  );
}

export default function FillsManager({ fills }: { fills: AdminFill[] }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-brown-soft">סוגי המילוי קבועים כרגע: ללא מילוי וצבע אחד. אפשר להפעיל או לכבות כל אחד מהם.</p>
      <ul className="space-y-3">
        {fills.map((f) => (
          <FillRow key={f.id} fill={f} />
        ))}
      </ul>
    </div>
  );
}
