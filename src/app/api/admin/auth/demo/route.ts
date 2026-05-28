import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

import { ADMIN_DEMO_COOKIE } from "@/lib/admin-demo";

const COOKIE = ADMIN_DEMO_COOKIE;

/** Аварийный вход в админку без Supabase Auth (только если ENABLE_DEMO_ADMIN=1 на сервере). */
export async function POST() {
  if (process.env.ENABLE_DEMO_ADMIN?.trim() !== "1") {
    return NextResponse.json(
      {
        error:
          "Добавьте ENABLE_DEMO_ADMIN=1 в .env.production на сервере и выполните pm2 restart.",
      },
      { status: 403 },
    );
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}

