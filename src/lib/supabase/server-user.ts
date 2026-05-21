import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { isSupabaseAuthConfigured } from "@/lib/env/supabase";

/** Session-scoped client (anon key + cookies). Use in Server Components / Route Handlers. */
export async function createSupabaseServerUserClient() {
  if (!isSupabaseAuthConfigured()) return null;
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            /* ignore when called outside mutable context */
          }
        },
      },
    },
  );
}

export async function getSupabaseUser() {
  if (!isSupabaseAuthConfigured()) return { id: "local", email: null as string | null };
  const supabase = await createSupabaseServerUserClient();
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return { id: data.user.id, email: data.user.email ?? null };
}
