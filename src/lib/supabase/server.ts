import { createServerClient } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { requireSupabaseEnv } from "./env";

/**
 * Server client bound to the visitor's session cookies (admin pages and server actions).
 * Row Level Security decides what it may read or write. Reads cookies, so it must be used
 * behind a <Suspense> boundary or inside a server action.
 */
export async function createSessionSupabase(): Promise<SupabaseClient> {
  const { url, anonKey } = requireSupabaseEnv();
  const cookieStore = await cookies();
  return createServerClient(url, anonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (list) => {
        try {
          list.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a Server Component: cookies cannot be written there. The proxy
          // refreshes the session, so ignoring this is safe.
        }
      },
    },
  });
}

/** Cookie-less anon client for public catalog reads (RLS only exposes active/available rows). */
export function createPublicSupabase(): SupabaseClient {
  const { url, anonKey } = requireSupabaseEnv();
  return createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
}
