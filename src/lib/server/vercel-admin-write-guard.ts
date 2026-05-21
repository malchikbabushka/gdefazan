import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/env/supabase";

/** Prod/preview на Vercel; не `vercel dev` (там ФС обычно доступна для записи). */
function isVercelServerlessDeploy(): boolean {
  if (!process.env.VERCEL) return false;
  if (process.env.VERCEL_ENV === "development") return false;
  return true;
}

/** На Vercel ФС только для чтения — запись в demo JSON падает. */
export function vercelAdminWritesBlockedResponse(): NextResponse | null {
  if (!isVercelServerlessDeploy()) return null;
  if (isSupabaseConfigured()) return null;
  return NextResponse.json(
    {
      error:
        "На Vercel админка не может сохранять в локальный JSON. В Vercel → Environment Variables задайте NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY и SUPABASE_SERVICE_ROLE_KEY (именно так, без NEXT_PUBLIC_ у service role), затем Redeploy — NEXT_PUBLIC_* подхватываются при сборке.",
    },
    { status: 503 },
  );
}
