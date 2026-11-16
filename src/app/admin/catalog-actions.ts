"use server";

import { revalidatePath } from "next/cache";
import { getAdminContext } from "@/lib/admin/session";
import { HEX_RE, cleanName, parseSortOrder, type ActionResult } from "@/lib/admin/catalog";
import { UUID_RE } from "@/lib/admin/orders";

const FAIL: ActionResult = { ok: false, error: "השמירה נכשלה. נסו שוב." };
const done = (): ActionResult => {
  revalidatePath("/admin", "layout");
  return { ok: true };
};

type SortableTable = "models" | "colors";
const isSortableTable = (t: string): t is SortableTable => t === "models" || t === "colors";

/** Only a real admin gets a client; anyone else is refused before touching the database. */
async function adminClient() {
  const ctx = await getAdminContext();
  return ctx.status === "admin" ? ctx.supabase : null;
}

/** Next sort_order = last + 10, so new items appear at the end. */
async function nextSortOrder(supabase: NonNullable<Awaited<ReturnType<typeof adminClient>>>, table: SortableTable) {
  const { data } = await supabase.from(table).select("sort_order").order("sort_order", { ascending: false }).limit(1);
  return ((data?.[0]?.sort_order as number | undefined) ?? 0) + 10;
}

// ---------------------------------------------------------------- models

export async function createModel(
  name: string,
  imageUrl: string,
  options: { active?: boolean; sortOrder?: number | null } = {},
): Promise<ActionResult> {
  const clean = cleanName(name);
  if (!clean) return { ok: false, error: "יש להזין שם לדגם." };
  if (typeof imageUrl !== "string" || !/^https?:\/\//.test(imageUrl)) return { ok: false, error: "יש להעלות תמונה." };

  const supabase = await adminClient();
  if (!supabase) return FAIL;
  const sort_order = parseSortOrder(options.sortOrder) ?? (await nextSortOrder(supabase, "models"));
  const { error } = await supabase
    .from("models")
    .insert({ name: clean, image_url: imageUrl, sort_order, active: options.active !== false });
  return error ? FAIL : done();
}

export async function updateModel(
  id: string,
  patch: { name?: string; active?: boolean; imageUrl?: string },
): Promise<ActionResult> {
  if (!UUID_RE.test(id)) return FAIL;
  const update: Record<string, unknown> = {};

  if (patch.name !== undefined) {
    const clean = cleanName(patch.name);
    if (!clean) return { ok: false, error: "השם לא יכול להיות ריק." };
    update.name = clean;
  }
  if (patch.active !== undefined) update.active = patch.active === true;
  if (patch.imageUrl !== undefined) {
    if (!/^https?:\/\//.test(patch.imageUrl)) return FAIL;
    // The colour-preview masks belong to the old photo, so they are cleared with it.
    Object.assign(update, { image_url: patch.imageUrl, fit: null, mask_body_url: null, mask_fill_url: null });
  }
  if (!Object.keys(update).length) return FAIL;

  const supabase = await adminClient();
  if (!supabase) return FAIL;
  const { data, error } = await supabase.from("models").update(update).eq("id", id).select("id");
  return error || !data?.length ? FAIL : done();
}

// ---------------------------------------------------------------- colors

export async function createColor(
  name: string,
  hex: string,
  options: { available?: boolean; sortOrder?: number | null } = {},
): Promise<ActionResult> {
  const clean = cleanName(name, 40);
  if (!clean) return { ok: false, error: "יש להזין שם לצבע." };
  if (!HEX_RE.test(hex)) return { ok: false, error: "קוד הצבע חייב להיות מהצורה #RRGGBB." };

  const supabase = await adminClient();
  if (!supabase) return FAIL;
  const sort_order = parseSortOrder(options.sortOrder) ?? (await nextSortOrder(supabase, "colors"));
  const { error } = await supabase
    .from("colors")
    .insert({ name: clean, hex: hex.toUpperCase(), sort_order, available: options.available !== false });
  return error ? FAIL : done();
}

export async function updateColor(
  id: string,
  patch: { name?: string; hex?: string; available?: boolean },
): Promise<ActionResult> {
  if (!UUID_RE.test(id)) return FAIL;
  const update: Record<string, unknown> = {};

  if (patch.name !== undefined) {
    const clean = cleanName(patch.name, 40);
    if (!clean) return { ok: false, error: "השם לא יכול להיות ריק." };
    update.name = clean;
  }
  if (patch.hex !== undefined) {
    if (!HEX_RE.test(patch.hex)) return { ok: false, error: "קוד הצבע חייב להיות מהצורה #RRGGBB." };
    update.hex = patch.hex.toUpperCase();
  }
  if (patch.available !== undefined) update.available = patch.available === true;
  if (!Object.keys(update).length) return FAIL;

  const supabase = await adminClient();
  if (!supabase) return FAIL;
  const { data, error } = await supabase.from("colors").update(update).eq("id", id).select("id");
  return error || !data?.length ? FAIL : done();
}

// ---------------------------------------------------------------- fills

export async function updateFill(id: string, available: boolean): Promise<ActionResult> {
  if (id !== "none" && id !== "single") return FAIL;
  const supabase = await adminClient();
  if (!supabase) return FAIL;

  if (!available) {
    // Customers must always be able to pick something, so at least one fill stays on.
    const { data } = await supabase.from("fills").select("id").eq("available", true);
    const others = (data ?? []).filter((f) => f.id !== id);
    if (!others.length) return { ok: false, error: "חייב להישאר לפחות סוג מילוי אחד זמין." };
  }
  const { data, error } = await supabase.from("fills").update({ available }).eq("id", id).select("id");
  return error || !data?.length ? FAIL : done();
}

// ---------------------------------------------------------------- order

/** Moves an item one step up or down by swapping its position with the neighbour. */
export async function moveRow(table: string, id: string, direction: "up" | "down"): Promise<ActionResult> {
  if (!isSortableTable(table) || !UUID_RE.test(id) || (direction !== "up" && direction !== "down")) return FAIL;
  const supabase = await adminClient();
  if (!supabase) return FAIL;

  const { data, error } = await supabase
    .from(table)
    .select("id, sort_order")
    .order("sort_order")
    .order("created_at");
  if (error || !data) return FAIL;

  const ids = data.map((r) => r.id as string);
  const from = ids.indexOf(id);
  const to = direction === "up" ? from - 1 : from + 1;
  if (from < 0) return FAIL;
  if (to < 0 || to >= ids.length) return { ok: true }; // already at the edge

  [ids[from], ids[to]] = [ids[to], ids[from]];
  // Re-number 10, 20, 30... so ties can never leave the order ambiguous.
  for (let i = 0; i < ids.length; i++) {
    const wanted = (i + 1) * 10;
    const current = data.find((r) => r.id === ids[i])?.sort_order;
    if (current === wanted) continue;
    const { error: updateError } = await supabase.from(table).update({ sort_order: wanted }).eq("id", ids[i]);
    if (updateError) return FAIL;
  }
  return done();
}
