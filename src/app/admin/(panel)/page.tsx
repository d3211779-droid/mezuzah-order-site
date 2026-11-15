import Link from "next/link";
import { connection } from "next/server";
import StatusSelect from "@/components/admin/StatusSelect";
import Swatch from "@/components/admin/Swatch";
import {
  ORDER_COLUMNS,
  ORDER_STATUSES,
  fillLabel,
  formatOrderDate,
  isOrderStatus,
  type OrderRow,
} from "@/lib/admin/orders";
import { createSessionSupabase } from "@/lib/supabase/server";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default async function AdminOrdersPage({ searchParams }: { searchParams: SearchParams }) {
  await connection();
  const sp = await searchParams;
  // Characters that have a meaning inside a PostgREST filter are replaced before searching.
  const q = first(sp.q).replace(/[,()%*\\"]/g, " ").trim().slice(0, 60);
  const statusParam = first(sp.status);
  const status = isOrderStatus(statusParam) ? statusParam : null;

  const supabase = await createSessionSupabase();
  let query = supabase.from("orders").select(ORDER_COLUMNS).order("created_at", { ascending: false }).limit(300);
  if (status) query = query.eq("status", status);
  if (q) {
    // One search box: customer name, phone number (digits only) or order number.
    const digits = q.replace(/\D/g, "");
    const parts = [`customer_name.ilike.%${q}%`, `order_number.ilike.%${q}%`];
    if (digits.length >= 3) parts.push(`phone.ilike.%${digits}%`);
    query = query.or(parts.join(","));
  }
  const { data, error } = await query;
  const orders = (data ?? []) as OrderRow[];

  const chipHref = (s: string | null) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (s) params.set("status", s);
    const qs = params.toString();
    return qs ? `/admin?${qs}` : "/admin";
  };

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-2xl font-bold">הזמנות</h1>
        <p className="text-sm text-brown-soft">{error ? "" : `${orders.length} הזמנות`}</p>
      </div>

      <form method="get" action="/admin" className="mb-4 flex gap-2">
        {status && <input type="hidden" name="status" value={status} />}
        <label htmlFor="q" className="sr-only">
          חיפוש לפי שם, טלפון או מספר הזמנה
        </label>
        <input
          id="q"
          name="q"
          defaultValue={q}
          placeholder="חיפוש לפי שם, טלפון או מספר הזמנה"
          className="min-h-12 min-w-0 flex-1 rounded-xl border border-[#dccfbd] bg-white px-4 text-base outline-none focus:border-gold focus:ring-2 focus:ring-gold-soft"
        />
        <button type="submit" className="min-h-12 rounded-xl bg-brown px-6 font-bold text-white">
          חיפוש
        </button>
        {(q || status) && (
          <Link href="/admin" className="flex min-h-12 items-center rounded-xl border border-line bg-white px-4 font-medium">
            ניקוי
          </Link>
        )}
      </form>

      <nav aria-label="סינון לפי סטטוס" className="-mx-1 mb-5 flex gap-2 overflow-x-auto px-1 pb-1">
        {[{ value: null, label: "הכל" }, ...ORDER_STATUSES].map((s) => {
          const active = (s.value ?? null) === status;
          return (
            <Link
              key={s.value ?? "all"}
              href={chipHref(s.value)}
              aria-current={active ? "true" : undefined}
              className={`flex min-h-11 shrink-0 items-center rounded-full border px-5 font-semibold ${
                active ? "border-brown bg-brown text-white" : "border-line bg-white hover:border-gold"
              }`}
            >
              {s.label}
            </Link>
          );
        })}
      </nav>

      {error ? (
        <p role="alert" className="rounded-2xl border border-line bg-white p-6 text-center text-error">
          לא הצלחנו לטעון את ההזמנות. רעננו את הדף ונסו שוב.
        </p>
      ) : orders.length === 0 ? (
        <p className="rounded-2xl border border-line bg-white p-8 text-center text-brown-soft">
          {q || status ? "לא נמצאו הזמנות שמתאימות לחיפוש." : "עדיין אין הזמנות."}
        </p>
      ) : (
        <ul className="space-y-3">
          {orders.map((o) => (
            <li key={o.id}>
              <article className="grid gap-3 rounded-2xl border border-line bg-white p-4 shadow-sm md:grid-cols-[minmax(0,1fr)_13rem] md:items-center">
                <Link href={`/admin/orders/${o.id}`} className="flex gap-4 rounded-xl outline-offset-4">
                  {o.model_image_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={o.model_image_url}
                      alt=""
                      className="h-20 w-20 shrink-0 rounded-xl border border-line bg-white object-contain"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-baseline gap-x-3 text-sm text-brown-soft">
                      <strong dir="ltr" className="text-base text-brown">
                        {o.order_number}
                      </strong>
                      <span>{formatOrderDate(o.created_at)}</span>
                    </p>
                    <p className="mt-0.5 font-bold">
                      {o.customer_name}{" "}
                      <span dir="ltr" className="font-normal text-brown-soft">
                        {o.phone}
                      </span>
                    </p>
                    <p className="mt-1 text-sm">
                      {o.model_name}
                      <span className="mx-2 text-line">|</span>
                      <span className="inline-flex items-center gap-1.5">
                        <Swatch hex={o.body_color_hex} /> {o.body_color_name}
                      </span>
                    </p>
                    <p className="mt-1 text-sm text-brown-soft">
                      מילוי: {fillLabel(o)}
                      {o.fill_color_hex && (
                        <span className="ms-1 inline-flex items-center gap-1.5">
                          <Swatch hex={o.fill_color_hex} /> {o.fill_color_name}
                        </span>
                      )}
                      {o.personal_text && (
                        <>
                          <span className="mx-2 text-line">|</span>
                          טקסט: <strong className="text-brown">{o.personal_text}</strong>
                        </>
                      )}
                    </p>
                  </div>
                </Link>
                <StatusSelect orderId={o.id} status={o.status} />
              </article>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
