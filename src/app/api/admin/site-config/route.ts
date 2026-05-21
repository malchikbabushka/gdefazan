import { NextResponse } from "next/server";
import type { SiteConfig } from "@/lib/site-config";
import { isSupabaseConfigured } from "@/lib/env/supabase";
import { assertAdminSession } from "@/lib/server/admin-auth";
import { repoGetSiteConfig, repoPutSiteConfig } from "@/lib/server/admin-repository";

export async function GET() {
  const denied = await assertAdminSession();
  if (denied) return denied;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ persisted: false });
  }

  try {
    const config = await repoGetSiteConfig();
    return NextResponse.json({ config, persisted: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "failed to load site config" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const denied = await assertAdminSession();
  if (denied) return denied;

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { ok: false, error: "Supabase не настроен — сохраните настройки локально в браузере." },
      { status: 400 },
    );
  }

  const body = (await req.json()) as { config?: SiteConfig };
  if (!body.config || typeof body.config !== "object") {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  try {
    await repoPutSiteConfig(body.config);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "failed to save" }, { status: 500 });
  }
}
