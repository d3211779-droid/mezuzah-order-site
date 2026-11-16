import Link from "next/link";
import { connection } from "next/server";
import LogoutButton from "@/components/admin/LogoutButton";
import SettingsForm from "@/components/admin/SettingsForm";
import { getAdminContext } from "@/lib/admin/session";
import { SETTING_COLUMNS, parseSettings } from "@/lib/settings";
import { createSessionSupabase } from "@/lib/supabase/server";

// Postgres / PostgREST codes for "this table does not exist (yet)".
const MISSING_TABLE_CODES = new Set(["42P01", "PGRST205"]);

export default async function AdminSettingsPage() {
  await connection();
  const ctx = await getAdminContext();
  const email = ctx.status === "admin" ? ctx.user.email : null;

  const supabase = await createSessionSupabase();
  const { data, error } = await supabase.from("site_settings").select(SETTING_COLUMNS).eq("id", true).maybeSingle();
  if (error) {
    console.error(`[adminSettings] could not read site_settings | code=${error.code ?? "-"} | message=${error.message ?? "-"}`);
  }
  const notActivated = (!!error && MISSING_TABLE_CODES.has(error.code ?? "")) || (!error && !data);

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">הגדרות</h1>

      {notActivated ? (
        <section role="alert" className="rounded-3xl border border-gold bg-[#fbf6ed] p-5">
          <h2 className="mb-2 text-lg font-bold">ההגדרות עדיין לא הופעלו</h2>
          <p className="text-brown-soft">
            כדי לערוך את ההגדרות מכאן יש להריץ פעם אחת את הקובץ <code dir="ltr">supabase/settings.sql</code> ב-Supabase (SQL
            Editor). עד אז האתר ללקוחות ממשיך לעבוד עם הערכים הרגילים.
          </p>
        </section>
      ) : error ? (
        <p role="alert" className="rounded-2xl border border-line bg-white p-6 text-center text-error">
          לא הצלחנו לטעון את ההגדרות. רעננו את הדף ונסו שוב.
        </p>
      ) : (
        <SettingsForm settings={parseSettings(data)} />
      )}

      <section aria-labelledby="account" className="rounded-3xl border border-line bg-white p-5 shadow-sm">
        <h2 id="account" className="mb-3 text-lg font-bold">
          החשבון שלי
        </h2>
        <p className="mb-4 text-brown-soft">
          מחוברים בתור <strong dir="ltr">{email}</strong>
        </p>
        <LogoutButton />
      </section>

      <Link href="/" className="inline-flex min-h-11 items-center font-medium text-gold-deep">
        צפייה בדף ההזמנה ללקוחות ←
      </Link>
    </div>
  );
}
