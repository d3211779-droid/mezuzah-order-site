export type OrderStatus = "new" | "printing" | "ready" | "delivered";

/** badge = soft colours of the status chip / select; accent / top = the coloured edge of order cards / KPI cards. */
export const ORDER_STATUSES: { value: OrderStatus; label: string; badge: string; accent: string; top: string }[] = [
  { value: "new", label: "חדש", badge: "bg-[#fff1cc] text-[#7a5600] border-[#ecd48a]", accent: "border-s-[#e3b94d]", top: "border-t-[#e3b94d]" },
  { value: "printing", label: "בהדפסה", badge: "bg-[#dcebf7] text-[#24506f] border-[#a9c9e3]", accent: "border-s-[#7fb0d6]", top: "border-t-[#7fb0d6]" },
  { value: "ready", label: "מוכן", badge: "bg-[#e0f0dc] text-[#2f5f27] border-[#aed3a4]", accent: "border-s-[#82bb74]", top: "border-t-[#82bb74]" },
  { value: "delivered", label: "נמסר", badge: "bg-[#ece8e1] text-[#5c5148] border-[#d3ccc1]", accent: "border-s-[#b9b0a4]", top: "border-t-[#b9b0a4]" },
];

export const isOrderStatus = (value: unknown): value is OrderStatus =>
  ORDER_STATUSES.some((s) => s.value === value);

export const statusInfo = (status: string) => ORDER_STATUSES.find((s) => s.value === status) ?? ORDER_STATUSES[0];

/** One item of an order (a row of `order_items`). Prices are null only on orders placed before prices existed. */
export type OrderItemRow = {
  line_number: number;
  model_name: string;
  model_image_url: string | null;
  body_color_name: string;
  body_color_hex: string;
  fill_type: "none" | "single";
  fill_color_name: string | null;
  fill_color_hex: string | null;
  personal_text: string | null;
  quantity: number;
  /** Per unit: mezuzah + parchment (when there is one). */
  unit_price_agorot: number | null;
  line_total_agorot: number | null;
  /** Snapshot of the parchment add-on. All empty/false on orders without one (and before parchments existed). */
  has_parchment: boolean;
  parchment_name: string | null;
  parchment_size_cm: number | null;
  /** Parchment surcharge per unit, already included in unit_price_agorot. */
  parchment_price_agorot: number | null;
};

export type OrderRow = {
  id: string;
  order_number: string;
  created_at: string;
  customer_name: string;
  phone: string;
  customer_note: string | null;
  internal_note: string | null;
  status: OrderStatus;
  /** null on orders placed before prices existed. */
  total_amount_agorot: number | null;
  items: OrderItemRow[];
};

const ITEM_COLUMNS =
  "line_number, model_name, model_image_url, body_color_name, body_color_hex, fill_type, fill_color_name, fill_color_hex, personal_text, quantity, unit_price_agorot, line_total_agorot";
const PARCHMENT_ITEM_COLUMNS = "has_parchment, parchment_name, parchment_size_cm, parchment_price_agorot";

const orderColumns = (itemColumns: string) =>
  `id, order_number, created_at, customer_name, phone, customer_note, internal_note, status, total_amount_agorot, order_items(${itemColumns})`;

/** The columns the admin screens read: the order plus all of its items (with the parchment snapshot). */
export const ORDER_COLUMNS = orderColumns(`${ITEM_COLUMNS}, ${PARCHMENT_ITEM_COLUMNS}`);

/** Used only if supabase/parchments.sql has not been run yet: items without the parchment columns. */
const ORDER_COLUMNS_NO_PARCHMENT = orderColumns(ITEM_COLUMNS);

/** Used only if supabase/cart-orders.sql has not been run yet: the single product stored on the order itself. */
const LEGACY_ORDER_COLUMNS =
  "id, order_number, created_at, customer_name, phone, customer_note, internal_note, status, model_name, model_image_url, body_color_name, body_color_hex, fill_type, fill_color_name, fill_color_hex, personal_text";

/** Turns a database row (new or legacy shape) into an OrderRow with its items. */
function normalizeOrder(raw: Record<string, unknown>): OrderRow {
  const base = raw as unknown as OrderRow & { order_items?: OrderItemRow[] } & Partial<OrderItemRow>;
  const items: OrderItemRow[] = Array.isArray(base.order_items)
    ? base.order_items
        .map((item) => ({
          ...item,
          has_parchment: item.has_parchment === true,
          parchment_name: item.parchment_name ?? null,
          parchment_size_cm: item.parchment_size_cm ?? null,
          parchment_price_agorot: item.parchment_price_agorot ?? null,
        }))
        .sort((a, b) => a.line_number - b.line_number)
    : [
        {
          line_number: 1,
          model_name: base.model_name ?? "",
          model_image_url: base.model_image_url ?? null,
          body_color_name: base.body_color_name ?? "",
          body_color_hex: base.body_color_hex ?? "#cccccc",
          fill_type: base.fill_type === "single" ? "single" : "none",
          fill_color_name: base.fill_color_name ?? null,
          fill_color_hex: base.fill_color_hex ?? null,
          personal_text: base.personal_text ?? null,
          quantity: 1,
          unit_price_agorot: null,
          line_total_agorot: null,
          has_parchment: false,
          parchment_name: null,
          parchment_size_cm: null,
          parchment_price_agorot: null,
        },
      ];
  return {
    id: base.id,
    order_number: base.order_number,
    created_at: base.created_at,
    customer_name: base.customer_name,
    phone: base.phone,
    customer_note: base.customer_note,
    internal_note: base.internal_note,
    status: base.status,
    total_amount_agorot: base.total_amount_agorot ?? null,
    items,
  };
}

type QueryResult = { data: unknown; error: { code?: string; message?: string } | null };

// "relationship / table / column / permission missing": the new SQL has not been applied yet.
const NEW_SCHEMA_MISSING = new Set(["PGRST200", "PGRST204", "PGRST205", "42P01", "42703", "42501"]);

/**
 * Runs an orders query with the multi-item columns. If the database does not have order_items yet
 * (cart-orders.sql not run), it quietly repeats the query with the old single-product columns, so
 * the admin keeps working in every order of deployment. Accepts queries returning one row or many.
 */
export async function fetchOrders(
  run: (columns: string) => PromiseLike<QueryResult>,
): Promise<{ orders: OrderRow[]; error: QueryResult["error"] }> {
  let result = await run(ORDER_COLUMNS);
  if (result.error && NEW_SCHEMA_MISSING.has(result.error.code ?? "")) {
    // parchments.sql not run yet? Try the items without the parchment columns first.
    console.warn(`[admin orders] parchment columns not available (${result.error.code}) - run supabase/parchments.sql.`);
    result = await run(ORDER_COLUMNS_NO_PARCHMENT);
  }
  if (result.error && NEW_SCHEMA_MISSING.has(result.error.code ?? "")) {
    console.warn(`[admin orders] order_items not available (${result.error.code}) - using the legacy columns. Run supabase/cart-orders.sql.`);
    result = await run(LEGACY_ORDER_COLUMNS);
  }
  const raw = result.data;
  const list = Array.isArray(raw) ? raw : raw ? [raw] : [];
  return { orders: list.map((row) => normalizeOrder(row as Record<string, unknown>)), error: result.error };
}

const dateFormat = new Intl.DateTimeFormat("he-IL", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "Asia/Jerusalem",
});

export const formatOrderDate = (iso: string) => dateFormat.format(new Date(iso));

export const fillLabel = (item: Pick<OrderItemRow, "fill_type">) => (item.fill_type === "single" ? "צבע אחד" : "ללא מילוי");

/** Number of units in an order ("3 פריטים"). */
export const unitCount = (o: Pick<OrderRow, "items">) => o.items.reduce((sum, i) => sum + i.quantity, 0);
/** True when at least one item of the order includes a parchment. */
export const hasParchment = (o: Pick<OrderRow, "items">) => o.items.some((i) => i.has_parchment);

export const unitsLabel = (n: number) => (n === 1 ? "פריט אחד" : `${n} פריטים`);

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Characters that have a meaning inside a PostgREST filter are replaced before searching. */
export const cleanSearch = (raw: string) => raw.replace(/[,()%*\\"]/g, " ").trim().slice(0, 60);

/** One search box: customer name, order number or phone number (digits only). */
export function applyOrderSearch<T extends { or: (filters: string) => T }>(query: T, q: string): T {
  if (!q) return query;
  const digits = q.replace(/\D/g, "");
  const parts = [`customer_name.ilike.%${q}%`, `order_number.ilike.%${q}%`];
  if (digits.length >= 3) parts.push(`phone.ilike.%${digits}%`);
  return query.or(parts.join(","));
}

/** wa.me link for an Israeli phone number (05x... -> 9725x...). Null when the number does not look right. */
export function whatsappUrl(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  return /^0\d{8,9}$/.test(digits) ? `https://wa.me/972${digits.slice(1)}` : null;
}
