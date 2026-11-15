"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseEnv } from "./env";

let client: SupabaseClient | null = null;

/** Client for Client Components (order submit, admin image upload). Uses the anon key + RLS. */
export function getBrowserSupabase(): SupabaseClient {
  if (!client) {
    const { url, anonKey } = requireSupabaseEnv();
    client = createBrowserClient(url, anonKey);
  }
  return client;
}
