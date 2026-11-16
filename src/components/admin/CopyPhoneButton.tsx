"use client";

import { useState } from "react";

/** Copies the customer's phone number to the clipboard and says so. */
export default function CopyPhoneButton({ phone }: { phone: string }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");

  async function copy() {
    try {
      await navigator.clipboard.writeText(phone);
      setState("copied");
    } catch {
      setState("failed");
    }
    setTimeout(() => setState("idle"), 2500);
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="min-h-11 rounded-xl border border-line bg-white px-4 font-semibold transition hover:border-gold"
    >
      {state === "copied" ? "הועתק ✓" : state === "failed" ? "ההעתקה נכשלה" : "העתק טלפון"}
    </button>
  );
}
