import { createClient } from "@supabase/supabase-js";
import { isSupabaseConfigured } from "@/lib/env/supabase";

let warnedBadSupabaseHost = false;

export function createServiceRoleClient() {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured");
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
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
