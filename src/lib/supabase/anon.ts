import { createClient } from "@supabase/supabase-js";
import { isSupabaseAuthConfigured } from "@/lib/env/supabase";

let warnedBadSupabaseHost = false;

/**
 * Server-side Supabase client using anon key.
 * Intended for public storefront reads with RLS (no cookies/session).
 */
export function createAnonClient() {
  if (!isSupabaseAuthConfigured()) {
    throw new Error("Supabase is not configured");
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  if (!warnedBadSupabaseHost) {
    warnedBadSupabaseHost = true;
    try {
      if (new URL(url).hostname.endsWith(".supabase.com")) {
        console.warn(
          "[supabase] NEXT_PUBLIC_SUPABASE_URL: API host must be *.supabase.co — *.supabase.com does not resolve (see Supabase → Settings → API).",
        );
      }
    } catch {
      /* ignore */
    }
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

