import { NextResponse } from "next/server";
import { humanizeAuthError } from "@/lib/auth-errors";
import { isSupabaseAuthConfigured } from "@/lib/env/supabase";
import { createSupabaseServerUserClient } from "@/lib/supabase/server-user";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!isSupabaseAuthConfigured()) {
    return NextResponse.json({ error: "Supabase не настроен" }, { status: 503 });
  }

  let body: { email?: unknown; password?: unknown };
  try {
    body = (await req.json()) as { email?: unknown; password?: unknown };
  } catch {
    return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!email || !password) {
    return NextResponse.json({ error: "Email и пароль обязательны" }, { status: 400 });
  }

  const supabase = await createSupabaseServerUserClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase не настроен" }, { status: 503 });
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return NextResponse.json(
      { error: humanizeAuthError(error.message) },
      { status: 401 },
    );
  }

  return NextResponse.json({ ok: true });
}
