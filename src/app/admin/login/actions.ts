"use server";

import { redirect } from "next/navigation";
import { getAdminContext } from "@/lib/admin/session";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { createSessionSupabase } from "@/lib/supabase/server";

export type LoginState = { error: string | null };

export async function signIn(_prev: LoginState, formData: FormData): Promise<LoginState> {
  if (!getSupabaseEnv()) return { error: "המערכת עדיין לא מחוברת ל-Supabase (חסרים משתני סביבה)." };

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "יש להזין אימייל וסיסמה." };

  const supabase = await createSessionSupabase();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "האימייל או הסיסמה שגויים." };

  // Signed in is not enough: the user must be listed as an admin.
  const ctx = await getAdminContext();
  if (ctx.status !== "admin") {
    await supabase.auth.signOut();
    return { error: "למשתמש הזה אין הרשאת ניהול." };
  }
  redirect("/admin");
}
