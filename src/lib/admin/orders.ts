export type OrderStatus = "new" | "printing" | "ready" | "delivered";

export const ORDER_STATUSES: { value: OrderStatus; label: string; badge: string }[] = [
  { value: "new", label: "חדש", badge: "bg-[#fff1cc] text-[#7a5600] border-[#ecd48a]" },
  { value: "printing", label: "בהדפסה", badge: "bg-[#dcebf7] text-[#24506f] border-[#a9c9e3]" },
  { value: "ready", label: "מוכן", badge: "bg-[#e0f0dc] text-[#2f5f27] border-[#aed3a4]" },
  { value: "delivered", label: "נמסר", badge: "bg-[#ece8e1] text-[#5c5148] border-[#d3ccc1]" },
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
