"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminContext } from "@/lib/admin/session";
import { UUID_RE, isOrderStatus } from "@/lib/admin/orders";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { createSessionSupabase } from "@/lib/supabase/server";

export async function signOut() {
  if (getSupabaseEnv()) {
    const supabase = await createSessionSupabase();
    await supabase.auth.signOut();
  }
  redirect("/admin/login");
}

export type ActionResult = { ok: boolean };

/** Changes an order's status. Only admins can; the database enforces it too. */
export async function updateOrderStatus(orderId: string, status: string): Promise<ActionResult> {
  if (!UUID_RE.test(orderId) || !isOrderStatus(status)) return { ok: false };
  const ctx = await getAdminContext();
  if (ctx.status !== "admin") return { ok: false };

  const { data, error } = await ctx.supabase.from("orders").update({ status }).eq("id", orderId).select("id");
  if (error || !data?.length) return { ok: false };
  revalidatePath("/admin", "layout");
  return { ok: true };
}

/** Saves the internal note (never shown to customers). */
export async function updateInternalNote(orderId: string, note: string): Promise<ActionResult> {
  if (!UUID_RE.test(orderId) || note.length > 4000) return { ok: false };
  const ctx = await getAdminContext();
  if (ctx.status !== "admin") return { ok: false };

  const { data, error } = await ctx.supabase
    .from("orders")
    .update({ internal_note: note.trim() || null })
    .eq("id", orderId)
    .select("id");
  if (error || !data?.length) return { ok: false };
  revalidatePath("/admin", "layout");
  return { ok: true };
}
