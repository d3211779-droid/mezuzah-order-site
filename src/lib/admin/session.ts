import type { SupabaseClient, User } from "@supabase/supabase-js";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { createSessionSupabase } from "@/lib/supabase/server";

export type AdminContext =
  | { status: "unconfigured" }
  | { status: "signed-out" }
  | { status: "not-admin"; user: User }
  | { status: "admin"; user: User; supabase: SupabaseClient };

/**
 * Who is looking at the admin panel? "admin" only when the visitor is signed in AND listed in
 * the admins table (checked by the database function is_admin()). Reads cookies, so call it
 * behind <Suspense> or inside a server action.
 */
export async function getAdminContext(): Promise<AdminContext> {
  if (!getSupabaseEnv()) return { status: "unconfigured" };
  const supabase = await createSessionSupabase();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return { status: "signed-out" };
  const { data: isAdmin } = await supabase.rpc("is_admin");
  return isAdmin === true ? { status: "admin", user: data.user, supabase } : { status: "not-admin", user: data.user };
}
