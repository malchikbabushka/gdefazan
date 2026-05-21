"use client";

import { createBrowserClient } from "@supabase/ssr";
import { isSupabaseAuthConfigured } from "@/lib/env/supabase";

export function createSupabaseBrowserClient() {
  if (!isSupabaseAuthConfigured()) {
    throw new Error("Supabase is not configured");
  }
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
