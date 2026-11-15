"use client";

import { getBrowserSupabase } from "@/lib/supabase/browser";
import { normalizePhone, type OrderValues } from "@/lib/validation";

export type SubmitResult = { ok: true; orderNumber: string } | { ok: false };

/**
 * Saves an order through the create_order() database function - the only write
 * customers are allowed. The database re-checks everything and returns the new
 * order number (MZ-1001, ...). Never throws: any failure becomes { ok: false }.
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
    if (error || typeof data !== "string" || !data) return { ok: false };
    return { ok: true, orderNumber: data };
  } catch {
    return { ok: false };
  }
}
