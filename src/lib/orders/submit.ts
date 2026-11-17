"use client";

import { getBrowserSupabase } from "@/lib/supabase/browser";
import { normalizePhone, type CustomerValues } from "@/lib/validation";

/** One cart line as it is sent: ids, text and quantity only. Never a price. */
export type SubmitItem = {
  modelId: string;
  bodyColorId: string;
  fillType: "none" | "single";
  fillColorId: string | null;
  personalText: string;
  quantity: number;
};

export type SubmitResult =
  | { ok: true; orderNumber: string; totalAgorot: number }
  /** The real total is not the one the customer saw: nothing was saved, show the new prices. */
  | { ok: false; reason: "price_changed" }
  /** Something in the cart is not available any more (model, colour, fill, price). */
  | { ok: false; reason: "unavailable" }
  | { ok: false; reason: "failed" };

/** Order numbers are produced only by the database sequence: MZ-1001, MZ-1002, ... */
const ORDER_NUMBER_RE = /^MZ-\d+$/;

const UNAVAILABLE_CODES = [
  "invalid_model",
  "invalid_color",
  "invalid_fill",
  "invalid_fill_color",
  "price_not_set",
  "invalid_items",
  "invalid_quantity",
];

/**
 * Saves the whole cart as ONE order through create_cart_order() - the only write customers are
 * allowed. The database re-reads every price, computes the total itself and refuses the order
 * ("price_changed") when it differs from `expectedTotalAgorot`, the total the customer saw.
 * Success is reported ONLY when Supabase answered without an error AND returned a real order number.
 */
export async function submitCartOrder(
  items: SubmitItem[],
  customer: CustomerValues,
  expectedTotalAgorot: number,
  clientToken: string,
): Promise<SubmitResult> {
  try {
    const { data, error } = await getBrowserSupabase().rpc("create_cart_order", {
      p_items: items.map((i) => ({
        model_id: i.modelId,
        body_color_id: i.bodyColorId,
        fill_type: i.fillType,
        fill_color_id: i.fillType === "single" ? i.fillColorId : null,
        personal_text: i.personalText.trim() || null,
        quantity: i.quantity,
      })),
      p_customer_name: customer.fullName.trim(),
      p_phone: normalizePhone(customer.phone.trim()),
      p_customer_note: customer.note.trim() || null,
      p_expected_total_agorot: expectedTotalAgorot,
      p_client_token: clientToken,
    });

    if (error) {
      console.error("[submitCartOrder] Supabase create_cart_order failed:", error);
      const message = `${error.message ?? ""}`;
      if (message.includes("price_changed")) return { ok: false, reason: "price_changed" };
      if (UNAVAILABLE_CODES.some((code) => message.includes(code))) return { ok: false, reason: "unavailable" };
      return { ok: false, reason: "failed" };
    }

    const result = data as { order_number?: unknown; total_amount_agorot?: unknown } | null;
    if (
      !result ||
      typeof result.order_number !== "string" ||
      !ORDER_NUMBER_RE.test(result.order_number) ||
      typeof result.total_amount_agorot !== "number" ||
      !Number.isInteger(result.total_amount_agorot)
    ) {
      console.error("[submitCartOrder] create_cart_order returned an unexpected value:", data);
      return { ok: false, reason: "failed" };
    }
    return { ok: true, orderNumber: result.order_number, totalAgorot: result.total_amount_agorot };
  } catch (err) {
    console.error("[submitCartOrder] could not reach Supabase:", err);
    return { ok: false, reason: "failed" };
  }
}
