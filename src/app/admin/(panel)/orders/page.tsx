import Link from "next/link";
import { connection } from "next/server";
import StatusSelect from "@/components/admin/StatusSelect";
import Swatch from "@/components/Swatch";
import {
  ORDER_STATUSES,
  applyOrderSearch,
  cleanSearch,
  fetchOrders,
  fillLabel,
  formatOrderDate,
  isOrderStatus,
  statusInfo,
  unitCount,
  unitsLabel,
  type OrderStatus,
} from "@/lib/admin/orders";
import { formatPrice } from "@/lib/money";
import { createSessionSupabase } from "@/lib/supabase/server";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default async function AdminOrdersPage({ searchParams }: { searchParams: SearchParams }) {
  await connection();
  const sp = await searchParams;
  const q = cleanSearch(first(sp.q));
  const statusParam = first(sp.status);
  const status = isOrderStatus(statusParam) ? statusParam : null;

  const supabase = await createSessionSupabase();

  // The list itself (each order with all of its items) ...
  const list = fetchOrders((columns) => {
    let query = supabase.from("orders").select(columns).order("created_at", { ascending: false }).limit(300);
    if (status) query = query.eq("status", status);
    return applyOrderSearch(query, q);
  });

  // ... and one exact count per filter chip (they follow the search box, so "הכל (2)" matches what you see).
  const countFor = async (s: OrderStatus | null) => {
    let c = supabase.from("orders").select("id", { count: "exact", head: true });
    if (s) c = c.eq("status", s);
    const { count } = await applyOrderSearch(c, q);
    return count ?? 0;
  };
  const [{ orders, error }, ...counts] = await Promise.all([
    list,
    countFor(null),
    ...ORDER_STATUSES.map((s) => countFor(s.value)),
  ]);
  const chips = [
    { value: null as OrderStatus | null, label: "הכל", count: counts[0] },
    ...ORDER_STATUSES.map((s, i) => ({ value: s.value as OrderStatus | null, label: s.label, count: counts[i + 1] })),
  ];

  const chipHref = (s: string | null) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (s) params.set("status", s);
    const qs = params.toString();
    return qs ? `/admin/orders?${qs}` : "/admin/orders";
  };

  return (
    <div>
      <h1 className="mb-5 text-2xl font-bold">הזמנות</h1>

      <form method="get" action="/admin/orders" className="mb-4 flex gap-2">
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
          <Link href="/admin/orders" className="flex min-h-12 items-center rounded-xl border border-line bg-white px-4 font-medium">
            ניקוי
          </Link>
        )}
      </form>

      <nav aria-label="סינון לפי סטטוס" className="-mx-1 mb-5 flex gap-2 overflow-x-auto px-1 pb-1">
        {chips.map((c) => {
          const active = c.value === status;
          return (
            <Link
              key={c.value ?? "all"}
              href={chipHref(c.value)}
              aria-current={active ? "true" : undefined}
              className={`flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-5 font-semibold ${
                active ? "border-brown bg-brown text-white" : "border-line bg-white hover:border-gold"
              }`}
            >
              {c.label}
              <span
                className={`rounded-full px-2 text-sm ${active ? "bg-white/20 text-white" : "bg-cream-deep text-brown-soft"}`}
              >
                {c.count}
              </span>
            </Link>
          );
        })}
      </nav>

      {error && orders.length === 0 ? (
        <p role="alert" className="rounded-2xl border border-line bg-white p-6 text-center text-error">
          לא הצלחנו לטעון את ההזמנות. רעננו את הדף ונסו שוב.
        </p>
      ) : orders.length === 0 ? (
        <p className="rounded-2xl border border-line bg-white p-8 text-center text-brown-soft">
          {q || status ? "לא נמצאו הזמנות שמתאימות לחיפוש." : "עדיין אין הזמנות."}
        </p>
      ) : (
        <ul className="space-y-3">
          {orders.map((o) => {
            const firstItem = o.items[0];
            const more = o.items.length - 1;
            const units = unitCount(o);
            return (
              <li key={o.id}>
                <article
                  data-order-row
                  className={`grid gap-3 rounded-2xl border border-s-4 border-line bg-white p-4 shadow-sm md:grid-cols-[minmax(0,1fr)_13rem] md:items-center ${statusInfo(o.status).accent}`}
                >
                  <Link href={`/admin/orders/${o.id}`} className="flex gap-4 rounded-xl outline-offset-4">
                    {firstItem?.model_image_url && (
                      <div className="relative shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={firstItem.model_image_url}
                          alt=""
                          className="h-20 w-20 rounded-xl border border-line bg-white object-contain"
                        />
                        {more > 0 && (
                          <span
                            data-more-badge
                            className="absolute -bottom-1 -end-1 rounded-full bg-brown px-2 py-0.5 text-xs font-bold text-white"
                          >
                            +{more}
                          </span>
                        )}
                      </div>
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
                      {firstItem && (
                        <>
                          <p className="mt-1 text-sm">
                            {firstItem.model_name}
                            {firstItem.quantity > 1 && <span className="font-bold"> ×{firstItem.quantity}</span>}
                            <span className="mx-2 text-line">|</span>
                            גוף:{" "}
                            <span className="inline-flex items-center gap-1.5">
                              <Swatch hex={firstItem.body_color_hex} name={firstItem.body_color_name} /> {firstItem.body_color_name}
                            </span>
                          </p>
                          <p className="mt-1 text-sm text-brown-soft">
                            מילוי: {fillLabel(firstItem)}
                            {firstItem.fill_type === "single" && firstItem.fill_color_hex && (
                              <span className="ms-1 inline-flex items-center gap-1.5">
                                <Swatch hex={firstItem.fill_color_hex} name={firstItem.fill_color_name} /> {firstItem.fill_color_name}
                              </span>
                            )}
                            {firstItem.personal_text && (
                              <>
                                <span className="mx-2 text-line">|</span>
                                טקסט: <strong className="text-brown">{firstItem.personal_text}</strong>
                              </>
                            )}
                          </p>
                        </>
                      )}
                      <p className="mt-2 flex flex-wrap items-center gap-x-3 text-sm">
                        <span data-order-units className="rounded-full bg-cream-deep px-3 py-0.5 font-medium">
                          {unitsLabel(units)}
                          {more > 0 && <span className="text-brown-soft"> · {o.items.length} דגמים</span>}
                        </span>
                        <span>
                          סה״כ:{" "}
                          <strong data-order-total className="text-base">
                            {o.total_amount_agorot === null ? "—" : formatPrice(o.total_amount_agorot)}
                          </strong>
                        </span>
                      </p>
                    </div>
                  </Link>
                  <StatusSelect orderId={o.id} status={o.status} />
                </article>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
