"use client";

import { useState, useTransition } from "react";
import { updateInternalNote } from "@/app/admin/actions";

export default function NoteForm({ orderId, initialNote }: { orderId: string; initialNote: string }) {
  const [note, setNote] = useState(initialNote);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  function save() {
    setMessage(null);
    startTransition(async () => {
      const result = await updateInternalNote(orderId, note);
      setMessage(result.ok ? { ok: true, text: "ההערה נשמרה" } : { ok: false, text: "לא הצלחנו לשמור את ההערה. נסו שוב." });
    });
  }

  return (
    <div>
      <label htmlFor="internal-note" className="mb-2 block font-medium">
        הערה פנימית <span className="text-sm font-normal text-brown-soft">(הלקוח לא רואה)</span>
      </label>
      <textarea
        id="internal-note"
        rows={4}
        maxLength={4000}
        value={note}
        onChange={(e) => {
          setNote(e.target.value);
          setMessage(null);
        }}
        className="w-full rounded-xl border border-[#dccfbd] bg-paper px-4 py-3 text-base outline-none transition focus:border-gold focus:ring-2 focus:ring-gold-soft"
      />
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="min-h-12 rounded-2xl bg-gold px-8 font-bold text-white transition hover:bg-[#9c7a3e] disabled:cursor-wait disabled:opacity-70"
        >
          {pending ? "שומר…" : "שמירת הערה"}
        </button>
        {message && (
          <span role="status" className={`text-sm font-medium ${message.ok ? "text-[#2f5f27]" : "text-error"}`}>
            {message.text}
          </span>
        )}
      </div>
    </div>
  );
}
