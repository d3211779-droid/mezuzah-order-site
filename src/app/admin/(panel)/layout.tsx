import { connection } from "next/server";
import { redirect } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import AdminNav from "@/components/admin/AdminNav";
import LogoutButton from "@/components/admin/LogoutButton";
import { getAdminContext } from "@/lib/admin/session";

export default function AdminPanelLayout({ children }: { children: ReactNode }) {
  // Reading the session cookie is request-time work, so it streams in behind Suspense.
  return (
    <Suspense fallback={<p role="status" className="p-8 text-center text-brown-soft">טוען…</p>}>
      <AdminGate>{children}</AdminGate>
    </Suspense>
  );
}

/** Real authorization: signed in AND listed in the admins table. Everything else is turned away. */
async function AdminGate({ children }: { children: ReactNode }) {
  await connection(); // always rendered per request, never part of the static shell
  const ctx = await getAdminContext();
  if (ctx.status === "unconfigured" || ctx.status === "signed-out") redirect("/admin/login");

  if (ctx.status === "not-admin") {
    return (
      <main className="mx-auto max-w-md px-4 py-16 text-center">
        <div className="rounded-3xl border border-line bg-white p-8 shadow-sm">
          <h1 className="text-xl font-bold">אין הרשאת ניהול</h1>
          <p className="mt-2 text-brown-soft">המשתמש {ctx.user.email} אינו מוגדר כמנהל. פנו לבעל המערכת.</p>
          <div className="mt-6 flex justify-center">
            <LogoutButton />
          </div>
        </div>
      </main>
    );
  }

  return (
    <div className="lg:flex">
      <AdminNav />
      <main className="mx-auto w-full min-w-0 max-w-5xl flex-1 px-4 pb-16 pt-6 lg:px-8 lg:pt-8">{children}</main>
    </div>
  );
}
