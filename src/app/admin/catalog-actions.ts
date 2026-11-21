"use server";

import { revalidatePath } from "next/cache";
import { getAdminContext } from "@/lib/admin/session";
import { HEX_RE, cleanName, cleanOptionalText, parseSizeCm, parseSortOrder, type ActionResult } from "@/lib/admin/catalog";
import { UUID_RE } from "@/lib/admin/orders";
import { asPriceAgorot } from "@/lib/money";

const FAIL: ActionResult = { ok: false, error: "השמירה נכשלה. נסו שוב." };
const done = (): ActionResult => {
  revalidatePath("/admin", "layout");
  return { ok: true };
};

type SortableTable = "models" | "colors" | "parchments";
const isSortableTable = (t: string): t is SortableTable => t === "models" || t === "colors" || t === "parchments";

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
  options: { active?: boolean; sortOrder?: number | null; priceAgorot?: number | null } = {},
): Promise<ActionResult> {
  const clean = cleanName(name);
  if (!clean) return { ok: false, error: "יש להזין שם לדגם." };
  if (typeof imageUrl !== "string" || !/^https?:\/\//.test(imageUrl)) return { ok: false, error: "יש להעלות תמונה." };

  const supabase = await adminClient();
  if (!supabase) return FAIL;
  const sort_order = parseSortOrder(options.sortOrder) ?? (await nextSortOrder(supabase, "models"));
  const { error } = await supabase.from("models").insert({
    name: clean,
    image_url: imageUrl,
    sort_order,
    active: options.active !== false,
    price_agorot: asPriceAgorot(options.priceAgorot),
  });
  return error ? FAIL : done();
}

export async function updateModel(
  id: string,
  patch: { name?: string; active?: boolean; imageUrl?: string; priceAgorot?: number | null },
): Promise<ActionResult> {
  if (!UUID_RE.test(id)) return FAIL;
  const update: Record<string, unknown> = {};

  if (patch.name !== undefined) {
    const clean = cleanName(patch.name);
    if (!clean) return { ok: false, error: "השם לא יכול להיות ריק." };
    update.name = clean;
  }
  if (patch.active !== undefined) update.active = patch.active === true;
  if (patch.priceAgorot !== undefined) {
    // null clears the price (the model can no longer be ordered); anything else must be a valid price.
    const price = patch.priceAgorot === null ? null : asPriceAgorot(patch.priceAgorot);
    if (patch.priceAgorot !== null && price === null) return { ok: false, error: "המחיר חייב להיות בין 0.01 ל-10,000 ₪." };
    update.price_agorot = price;
  }
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

// ---------------------------------------------------------------- parchments

const PRICE_ERROR = "המחיר חייב להיות בין 0.01 ל-10,000 ₪.";
const NEEDS_PRICE = "אי אפשר להפעיל קלף בלי מחיר. הזינו מחיר ושמרו.";

export type ParchmentInput = {
  name: string;
  description?: string | null;
  note?: string | null;
  sizeCm: number;
  priceAgorot?: number | null;
  available?: boolean;
  sortOrder?: number | null;
};

export async function createParchment(input: ParchmentInput): Promise<ActionResult> {
  const name = cleanName(input.name);
  if (!name) return { ok: false, error: "יש להזין שם לקלף." };
  const description = cleanOptionalText(input.description, 200);
  if (description === undefined) return { ok: false, error: "התיאור ארוך מדי (עד 200 תווים)." };
  const note = cleanOptionalText(input.note, 500);
  if (note === undefined) return { ok: false, error: "ההערה ארוכה מדי (עד 500 תווים)." };
  const size = parseSizeCm(input.sizeCm);
  if (size === null) return { ok: false, error: "הגודל חייב להיות מספר שלם בין 1 ל-100 ס״מ." };
  const price = input.priceAgorot === null || input.priceAgorot === undefined ? null : asPriceAgorot(input.priceAgorot);
  if (input.priceAgorot !== null && input.priceAgorot !== undefined && price === null) return { ok: false, error: PRICE_ERROR };
  const available = input.available === true;
  if (available && price === null) return { ok: false, error: NEEDS_PRICE };

  const supabase = await adminClient();
  if (!supabase) return FAIL;
  const sort_order = parseSortOrder(input.sortOrder) ?? (await nextSortOrder(supabase, "parchments"));
  const { error } = await supabase
    .from("parchments")
    .insert({ name, description, note, size_cm: size, price_agorot: price, available, sort_order });
  return error ? FAIL : done();
}

export async function updateParchment(
  id: string,
  patch: {
    name?: string;
    description?: string | null;
    note?: string | null;
    sizeCm?: number;
    priceAgorot?: number | null;
    available?: boolean;
  },
): Promise<ActionResult> {
  if (!UUID_RE.test(id)) return FAIL;
  const update: Record<string, unknown> = {};

  if (patch.name !== undefined) {
    const name = cleanName(patch.name);
    if (!name) return { ok: false, error: "השם לא יכול להיות ריק." };
    update.name = name;
  }
  if (patch.description !== undefined) {
    const description = cleanOptionalText(patch.description, 200);
    if (description === undefined) return { ok: false, error: "התיאור ארוך מדי (עד 200 תווים)." };
    update.description = description;
  }
  if (patch.note !== undefined) {
    const note = cleanOptionalText(patch.note, 500);
    if (note === undefined) return { ok: false, error: "ההערה ארוכה מדי (עד 500 תווים)." };
    update.note = note;
  }
  if (patch.sizeCm !== undefined) {
    const size = parseSizeCm(patch.sizeCm);
    if (size === null) return { ok: false, error: "הגודל חייב להיות מספר שלם בין 1 ל-100 ס״מ." };
    update.size_cm = size;
  }
  if (patch.priceAgorot !== undefined) {
    const price = patch.priceAgorot === null ? null : asPriceAgorot(patch.priceAgorot);
    if (patch.priceAgorot !== null && price === null) return { ok: false, error: PRICE_ERROR };
    update.price_agorot = price;
  }
  if (patch.available !== undefined) update.available = patch.available === true;
  if (!Object.keys(update).length) return FAIL;

  const supabase = await adminClient();
  if (!supabase) return FAIL;

  // A parchment is only ever available with a price (the database enforces it too): check the result first
  // so the admin gets a clear message instead of a generic failure.
  if ("available" in update || "price_agorot" in update) {
    const { data: current } = await supabase.from("parchments").select("available, price_agorot").eq("id", id).maybeSingle();
    if (!current) return FAIL;
    const nextAvailable = "available" in update ? update.available === true : current.available === true;
    const nextPrice = "price_agorot" in update ? (update.price_agorot as number | null) : (current.price_agorot as number | null);
    if (nextAvailable && nextPrice === null) {
      return {
        ok: false,
        error: "available" in update ? NEEDS_PRICE : "קלף זמין חייב מחיר. השביתו אותו קודם, או הזינו מחיר.",
      };
    }
  }

  const { data, error } = await supabase.from("parchments").update(update).eq("id", id).select("id");
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
