"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseEnv } from "./env";

let client: SupabaseClient | null = null;

/** Client for Client Components (order submit, admin image upload). Uses the publishable key + RLS. */
export function getBrowserSupabase(): SupabaseClient {
  if (!client) {
    const { url, publishableKey } = requireSupabaseEnv();
    client = createBrowserClient(url, publishableKey);
  }
  return client;
}
