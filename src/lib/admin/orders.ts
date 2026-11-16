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

/** The columns the admin screens read from the `orders` table. */
export const ORDER_COLUMNS =
  "id, order_number, created_at, customer_name, phone, customer_note, model_name, model_image_url, body_color_name, body_color_hex, fill_type, fill_color_name, fill_color_hex, personal_text, internal_note, status";

export type OrderRow = {
  id: string;
  order_number: string;
  created_at: string;
  customer_name: string;
  phone: string;
  customer_note: string | null;
  model_name: string;
  model_image_url: string | null;
  body_color_name: string;
  body_color_hex: string;
  fill_type: "none" | "single";
  fill_color_name: string | null;
  fill_color_hex: string | null;
  personal_text: string | null;
  internal_note: string | null;
  status: OrderStatus;
};

const dateFormat = new Intl.DateTimeFormat("he-IL", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "Asia/Jerusalem",
});

export const formatOrderDate = (iso: string) => dateFormat.format(new Date(iso));

export const fillLabel = (o: Pick<OrderRow, "fill_type">) => (o.fill_type === "single" ? "צבע אחד" : "ללא מילוי");

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
