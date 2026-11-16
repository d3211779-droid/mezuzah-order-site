"use server";

import { revalidatePath } from "next/cache";
import { getAdminContext } from "@/lib/admin/session";
import { SETTING_FIELDS, checkSetting } from "@/lib/settings";

export type SaveSettingsResult = { ok: true } | { ok: false; error: string };

/**
 * Saves one or more settings. Every value is validated again here with the same rules as the
 * form (and the database re-checks them with CHECK constraints). Only real admins get through.
 * `values` is keyed by setting key, e.g. { personalTextMax: 8 }.
 */
export async function saveSettings(values: Record<string, unknown>): Promise<SaveSettingsResult> {
  if (!values || typeof values !== "object") return { ok: false, error: "הבקשה אינה תקינה." };

  const update: Record<string, string | number> = {};
  for (const [key, raw] of Object.entries(values)) {
    const field = SETTING_FIELDS.find((f) => f.key === key);
    if (!field) return { ok: false, error: "הגדרה לא מוכרת." };
    const checked = checkSetting(field, raw);
    if (!checked.ok) return { ok: false, error: checked.error };
    update[field.column] = checked.value;
  }
  if (!Object.keys(update).length) return { ok: false, error: "אין מה לשמור." };

  const ctx = await getAdminContext();
  if (ctx.status !== "admin") return { ok: false, error: "אין הרשאה." };

  const { data, error } = await ctx.supabase.from("site_settings").update(update).eq("id", true).select("id");
  if (error) {
    console.error(`[saveSettings] update failed | code=${error.code ?? "-"} | message=${error.message ?? "-"}`);
    return { ok: false, error: "השמירה נכשלה. נסו שוב." };
  }
  if (!data?.length) return { ok: false, error: "ההגדרות עדיין לא הופעלו במסד הנתונים." };

  revalidatePath("/admin", "layout");
  revalidatePath("/");
  return { ok: true };
}
