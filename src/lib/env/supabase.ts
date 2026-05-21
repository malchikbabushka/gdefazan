/** URL + anon (middleware, login UI, browser client). */
export function isSupabaseAuthConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim(),
  );
}

/** Full stack including service role (server DB / Storage). */
export function isSupabaseConfigured(): boolean {
  return isSupabaseAuthConfigured() && Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim());
}
