import { NextResponse } from "next/server";
import { isSupabaseAuthConfigured, isSupabaseConfigured } from "@/lib/env/supabase";

/** Только флаги, без секретов. Сравните с баннером «Демо» в админке. */
export const dynamic = "force-dynamic";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? "";

  return NextResponse.json({
    vercel: Boolean(process.env.VERCEL),
    serverAuthConfigured: isSupabaseAuthConfigured(),
    serverDbConfigured: isSupabaseConfigured(),
    publicUrlSet: url.length > 0,
    publicAnonSet: anon.length > 0,
    serviceRoleSet: service.length > 0,
  });
}
