import Link from "next/link";
import { connection } from "next/server";
import StatusBadge from "@/components/admin/StatusBadge";
import Swatch from "@/components/Swatch";
import { fetchOrders, formatOrderDate, statusInfo, unitCount, unitsLabel, type OrderStatus } from "@/lib/admin/orders";
import { formatPrice } from "@/lib/money";
import { createSessionSupabase } from "@/lib/supabase/server";

const RECENT_COUNT = 8;

/** Dashboard: live counters straight from the database, then the latest orders. */
export default async function AdminDashboardPage() {
  await connection();
  const supabase = await createSessionSupabase();

  const countFor = async (status: OrderStatus | null) => {
    let q = supabase.from("orders").select("id", { count: "exact", head: true });
    if (status) q = q.eq("status", status);
    const { count, error } = await q;
    return error ? null : (count ?? 0);
  };

  const [newCount, printingCount, readyCount, totalCount, recent] = await Promise.all([
    countFor("new"),
    countFor("printing"),
    countFor("ready"),
    countFor(null),
    fetchOrders((columns) => supabase.from("orders").select(columns).order("created_at", { ascending: false }).limit(RECENT_COUNT)),
  ]);

  const kpis: { label: string; value: number | null; href: string; status: OrderStatus | null }[] = [
    { label: "הזמנות חדשות", value: newCount, href: "/admin/orders?status=new", status: "new" },
    { label: "בהדפסה", value: printingCount, href: "/admin/orders?status=printing", status: "printing" },
    { label: "מוכנות", value: readyCount, href: "/admin/orders?status=ready", status: "ready" },
    { label: 'סה"כ הזמנות', value: totalCount, href: "/admin/orders", status: null },
  ];
  const orders = recent.orders;

  return (
    <div>
      <h1 className="mb-5 text-2xl font-bold">ראשי</h1>

      <section aria-label="סיכום הזמנות" className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((k) => (
          <Link
            key={k.label}
            href={k.href}
            data-kpi
            className={`rounded-2xl border border-t-4 border-line bg-white p-4 shadow-sm transition hover:border-gold ${
              k.status ? statusInfo(k.status).top : "border-t-brown"
            }`}
          >
            <p className="text-sm font-medium text-brown-soft">{k.label}</p>
            <p className="mt-1 text-4xl font-bold tabular-nums">{k.value ?? "—"}</p>
          </Link>
        ))}
      </section>

      <section aria-labelledby="recent">
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <h2 id="recent" className="text-xl font-bold">
            הזמנות אחרונות
          </h2>
          <Link href="/admin/orders" className="inline-flex min-h-11 items-center font-medium text-gold-deep">
            לכל ההזמנות ←
          </Link>
        </div>

        {recent.error && orders.length === 0 ? (
          <p role="alert" className="rounded-2xl border border-line bg-white p-6 text-center text-error">
            לא הצלחנו לטעון את ההזמנות. רעננו את הדף ונסו שוב.
          </p>
        ) : orders.length === 0 ? (
          <p className="rounded-2xl border border-line bg-white p-8 text-center text-brown-soft">עדיין אין הזמנות.</p>
        ) : (
          <ul className="space-y-2">
            {orders.map((o) => {
              const firstItem = o.items[0];
              return (
              <li key={o.id}>
                <Link
                  href={`/admin/orders/${o.id}`}
                  className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border border-line bg-white p-3 shadow-sm transition hover:border-gold sm:flex-nowrap"
                >
                  {firstItem?.model_image_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={firstItem.model_image_url}
                      alt=""
                      className="h-14 w-14 shrink-0 rounded-lg border border-line bg-white object-contain"
                    />
                  )}
                  <div className="min-w-0 flex-1 basis-40">
                    <p className="flex flex-wrap items-baseline gap-x-3">
                      <strong dir="ltr">{o.order_number}</strong>
                      <span className="font-bold">{o.customer_name}</span>
                    </p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-sm text-brown-soft">
                      {firstItem?.model_name}
                      {o.items.length > 1 && <span className="font-medium text-brown"> +{o.items.length - 1}</span>}
                      <span className="text-line">|</span>
                      {firstItem && (
                        <>
                          <span className="inline-flex items-center gap-1.5">
                            <Swatch hex={firstItem.body_color_hex} name={firstItem.body_color_name} /> {firstItem.body_color_name}
                          </span>
                          <span className="text-line">|</span>
                        </>
                      )}
                      {formatOrderDate(o.created_at)}
                    </p>
                    <p className="mt-0.5 text-sm">
                      {unitsLabel(unitCount(o))} · <strong>{o.total_amount_agorot === null ? "—" : formatPrice(o.total_amount_agorot)}</strong>
                    </p>
                  </div>
                  <StatusBadge status={o.status} />
                </Link>
              </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
