import Link from "next/link";
import { connection } from "next/server";
import LogoutButton from "@/components/admin/LogoutButton";
import { getAdminContext } from "@/lib/admin/session";
import { MAX_PERSONAL_TEXT, PERSONAL_TEXT_WIDTH_CM } from "@/lib/validation";

export default async function AdminSettingsPage() {
  await connection();
  const ctx = await getAdminContext();
  const email = ctx.status === "admin" ? ctx.user.email : null;

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">הגדרות</h1>

      <section aria-labelledby="account" className="rounded-3xl border border-line bg-white p-5 shadow-sm">
        <h2 id="account" className="mb-3 text-lg font-bold">
          החשבון שלי
        </h2>
        <p className="mb-4 text-brown-soft">
          מחוברים בתור <strong dir="ltr">{email}</strong>
        </p>
        <LogoutButton />
      </section>

      <section aria-labelledby="system" className="rounded-3xl border border-line bg-white p-5 shadow-sm">
        <h2 id="system" className="mb-3 text-lg font-bold">
          הגדרות הזמנה
        </h2>
        <dl className="divide-y divide-line">
          <div className="flex items-baseline justify-between gap-4 py-3">
            <dt className="text-brown-soft">אורך מרבי לטקסט אישי</dt>
            <dd className="font-medium">{MAX_PERSONAL_TEXT} תווים</dd>
          </div>
          <div className="flex items-baseline justify-between gap-4 py-3">
            <dt className="text-brown-soft">רוחב אזור ההדפסה</dt>
            <dd className="font-medium">כ־{PERSONAL_TEXT_WIDTH_CM} ס״מ</dd>
          </div>
        </dl>
        <p className="mt-3 text-sm text-brown-soft">
          ערכים אלה נקבעים כרגע בקוד האתר (<code dir="ltr">src/lib/validation.ts</code>). בהמשך אפשר יהיה לערוך אותם מכאן.
        </p>
      </section>

      <Link href="/" className="inline-flex min-h-11 items-center font-medium text-gold-deep">
        צפייה בדף ההזמנה ללקוחות ←
      </Link>
    </div>
  );
}
