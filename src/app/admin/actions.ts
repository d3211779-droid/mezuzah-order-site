"use server";

import { redirect } from "next/navigation";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { createSessionSupabase } from "@/lib/supabase/server";

export async function signOut() {
  if (getSupabaseEnv()) {
    const supabase = await createSessionSupabase();
    await supabase.auth.signOut();
  }
  redirect("/admin/login");
}
