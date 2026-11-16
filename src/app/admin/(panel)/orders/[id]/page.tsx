import Link from "next/link";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import CopyPhoneButton from "@/components/admin/CopyPhoneButton";
import NoteForm from "@/components/admin/NoteForm";
import StatusBadge from "@/components/admin/StatusBadge";
import StatusSelect from "@/components/admin/StatusSelect";
import Swatch from "@/components/admin/Swatch";
import { ORDER_COLUMNS, UUID_RE, fillLabel, formatOrderDate, statusInfo, whatsappUrl, type OrderRow } from "@/lib/admin/orders";
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
      <Swatch hex={hex} className="h-5 w-5" /> {name}
      <span dir="ltr" className="text-sm font-normal text-brown-soft">
        {hex}
      </span>
    </span>
  );
}

const card = "rounded-3xl border border-line bg-white p-5 shadow-sm";

export default async function AdminOrderPage({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();

  const supabase = await createSessionSupabase();
  const { data, error } = await supabase.from("orders").select(ORDER_COLUMNS).eq("id", id).maybeSingle();
  if (error) {
    return (
      <p role="alert" className="rounded-2xl border border-line bg-white p-6 text-center text-error">
        לא הצלחנו לטעון את ההזמנה. רעננו את הדף ונסו שוב.
      </p>
    );
  }
  if (!data) notFound();
  const o = data as OrderRow;
  const whatsapp = whatsappUrl(o.phone);

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
        <section aria-labelledby="product" className={card}>
          <h2 id="product" className="mb-4 text-lg font-bold">
            פרטי המוצר
          </h2>
          {o.model_image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={o.model_image_url}
              alt={`מזוזה בדגם ${o.model_name}`}
              className="mx-auto mb-4 h-80 w-full rounded-2xl border border-line bg-white object-contain sm:h-96"
            />
          )}
          <dl>
            <Row label="דגם">{o.model_name}</Row>
            <Row label="צבע גוף">
              <ColorValue hex={o.body_color_hex} name={o.body_color_name} />
            </Row>
            <Row label="מילוי">{fillLabel(o)}</Row>
            {o.fill_type === "single" && o.fill_color_hex && (
              <Row label="צבע מילוי">
                <ColorValue hex={o.fill_color_hex} name={o.fill_color_name} />
              </Row>
            )}
            <Row label="טקסט אישי">{o.personal_text ?? "—"}</Row>
          </dl>
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
