import Link from "next/link";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import CopyPhoneButton from "@/components/admin/CopyPhoneButton";
import NoteForm from "@/components/admin/NoteForm";
import StatusBadge from "@/components/admin/StatusBadge";
import StatusSelect from "@/components/admin/StatusSelect";
import Swatch from "@/components/Swatch";
import {
  UUID_RE,
  fetchOrders,
  fillLabel,
  formatOrderDate,
  statusInfo,
  unitCount,
  unitsLabel,
  whatsappUrl,
  type OrderItemRow,
} from "@/lib/admin/orders";
import { formatPrice } from "@/lib/money";
import { createSessionSupabase } from "@/lib/supabase/server";

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-line py-3 last:border-0">
      <dt className="shrink-0 text-brown-soft">{label}</dt>
      <dd className="min-w-0 break-words text-left font-medium">{children}</dd>
    </div>
  );
}

function ColorValue({ hex, name }: { hex: string; name: string | null }) {
  return (
    <span className="inline-flex items-center gap-2">
      <Swatch hex={hex} name={name} size="lg" className="h-5 w-5" /> {name}
      <span dir="ltr" className="text-sm font-normal text-brown-soft">
        {hex}
      </span>
    </span>
  );
}

const money = (agorot: number | null) => (agorot === null ? "—" : formatPrice(agorot));

/** One item of the order: photo, every option, quantity and price. */
function ItemCard({ item, index }: { item: OrderItemRow; index: number }) {
  return (
    <li data-order-item className="rounded-2xl border border-line bg-paper p-4">
      <div className="flex flex-wrap gap-4 sm:flex-nowrap">
        {item.model_image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.model_image_url}
            alt={`מזוזה בדגם ${item.model_name}`}
            className="h-40 w-full shrink-0 rounded-xl border border-line bg-white object-contain sm:h-36 sm:w-36"
          />
        )}
        <div className="min-w-0 flex-1">
          <p className="mb-1 text-sm text-brown-soft">פריט {index + 1}</p>
          <dl>
            <Row label="דגם">{item.model_name}</Row>
            <Row label="צבע גוף">
              <ColorValue hex={item.body_color_hex} name={item.body_color_name} />
            </Row>
            <Row label="מילוי">{fillLabel(item)}</Row>
            {item.fill_type === "single" && item.fill_color_hex && (
              <Row label="צבע מילוי">
                <ColorValue hex={item.fill_color_hex} name={item.fill_color_name} />
              </Row>
            )}
            <Row label="טקסט אישי">{item.personal_text ?? "—"}</Row>
            <Row label="כמות">
              <span data-item-quantity>{item.quantity}</span>
            </Row>
            <Row label="מחיר ליחידה">{money(item.unit_price_agorot)}</Row>
            <Row label="סה״כ לפריט">
              <strong data-item-total>{money(item.line_total_agorot)}</strong>
            </Row>
          </dl>
        </div>
      </div>
    </li>
  );
}

const card = "rounded-3xl border border-line bg-white p-5 shadow-sm";

export default async function AdminOrderPage({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();

  const supabase = await createSessionSupabase();
  const { orders, error } = await fetchOrders((columns) => supabase.from("orders").select(columns).eq("id", id).maybeSingle());
  if (error && orders.length === 0) {
    return (
      <p role="alert" className="rounded-2xl border border-line bg-white p-6 text-center text-error">
        לא הצלחנו לטעון את ההזמנה. רעננו את הדף ונסו שוב.
      </p>
    );
  }
  const o = orders[0];
  if (!o) notFound();
  const whatsapp = whatsappUrl(o.phone);
  const units = unitCount(o);

  return (
    <div>
      <Link href="/admin/orders" className="mb-4 inline-flex min-h-11 items-center font-medium text-gold-deep">
        ← חזרה להזמנות
      </Link>

      <div className={`mb-6 rounded-3xl border border-s-4 border-line bg-white p-5 shadow-sm ${statusInfo(o.status).accent}`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 dir="ltr" className="text-3xl font-bold">
            {o.order_number}
          </h1>
          <StatusBadge status={o.status} />
        </div>
        <p className="text-brown-soft">{formatOrderDate(o.created_at)}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section aria-labelledby="items" className={card}>
          <h2 id="items" className="mb-4 text-lg font-bold">
            פריטי ההזמנה <span className="text-sm font-normal text-brown-soft">({unitsLabel(units)})</span>
          </h2>
          <ul className="space-y-4">
            {o.items.map((item, i) => (
              <ItemCard key={item.line_number} item={item} index={i} />
            ))}
          </ul>
          <p className="mt-4 flex items-baseline justify-between gap-3 border-t border-line pt-4">
            <span className="text-lg font-bold">סה״כ הזמנה</span>
            <span>
              <strong data-order-total className="text-2xl">
                {money(o.total_amount_agorot)}
              </strong>{" "}
              {o.total_amount_agorot !== null && <span className="text-sm text-brown-soft">כולל מע״מ</span>}
            </span>
          </p>
          {o.total_amount_agorot === null && (
            <p className="mt-2 text-sm text-brown-soft">הזמנה זו נוצרה לפני שנוספו מחירים לאתר, ולכן אין לה סכום.</p>
          )}
        </section>

        <div className="space-y-6">
          <section aria-labelledby="customer" className={card}>
            <h2 id="customer" className="mb-2 text-lg font-bold">
              פרטי הלקוח
            </h2>
            <dl>
              <Row label="שם">{o.customer_name}</Row>
              <Row label="טלפון">
                <a href={`tel:${o.phone}`} dir="ltr" className="text-gold-deep underline">
                  {o.phone}
                </a>
              </Row>
              <Row label="הערת לקוח">
                <span className="whitespace-pre-wrap">{o.customer_note ?? "—"}</span>
              </Row>
            </dl>
            <div className="mt-4 flex flex-wrap gap-2">
              <CopyPhoneButton phone={o.phone} />
              {whatsapp && (
                <a
                  href={whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-h-11 items-center rounded-xl border border-line bg-white px-4 font-semibold transition hover:border-gold"
                >
                  פתח שיחה ב-WhatsApp
                </a>
              )}
            </div>
          </section>

          <section aria-labelledby="manage" className={card}>
            <h2 id="manage" className="mb-4 text-lg font-bold">
              ניהול ההזמנה
            </h2>
            <p className="mb-1 text-brown-soft">סטטוס</p>
            <StatusSelect orderId={o.id} status={o.status} />
            <div className="mt-5">
              <NoteForm orderId={o.id} initialNote={o.internal_note ?? ""} />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
