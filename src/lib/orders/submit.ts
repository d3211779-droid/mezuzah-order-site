"use client";

import { getBrowserSupabase } from "@/lib/supabase/browser";
import { normalizePhone, type OrderValues } from "@/lib/validation";

export type SubmitResult = { ok: true; orderNumber: string } | { ok: false };

/** Order numbers are produced only by the database sequence: MZ-1001, MZ-1002, ... */
const ORDER_NUMBER_RE = /^MZ-\d+$/;

/**
 * Saves an order through the create_order() database function - the only write
 * customers are allowed. The database re-checks everything and returns the new
 * order number. Success is reported ONLY when Supabase answered without an error
 * AND returned a real order number; everything else is logged and becomes { ok: false }.
 */
export async function submitOrder(values: OrderValues): Promise<SubmitResult> {
  try {
    const { data, error } = await getBrowserSupabase().rpc("create_order", {
      p_model_id: values.modelId,
      p_body_color_id: values.colorId,
      p_fill_type: values.fillId,
      p_fill_color_id: values.fillId === "single" ? values.fillColorId : null,
      p_personal_text: values.personalText.trim() || null,
      p_customer_name: values.fullName.trim(),
      p_phone: normalizePhone(values.phone.trim()),
      p_customer_note: values.note.trim() || null,
    });

    if (error) {
      console.error("[submitOrder] Supabase create_order failed:", error);
      return { ok: false };
    }
    if (typeof data !== "string" || !ORDER_NUMBER_RE.test(data)) {
      console.error("[submitOrder] create_order returned an unexpected value (no order number):", data);
      return { ok: false };
    }
    return { ok: true, orderNumber: data };
  } catch (err) {
    console.error("[submitOrder] could not reach Supabase:", err);
    return { ok: false };
  }
}
