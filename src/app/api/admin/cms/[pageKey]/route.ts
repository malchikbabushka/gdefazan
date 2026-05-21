import { NextResponse } from "next/server";
import type { PageKey } from "@/lib/pages-store";
import { isSupabaseConfigured } from "@/lib/env/supabase";
import { assertAdminSession } from "@/lib/server/admin-auth";
import { repoGetCmsPage, repoPutCmsPage } from "@/lib/server/admin-repository";

const KEYS: PageKey[] = ["warranty", "shipping-payment", "brands", "catalog", "home"];

type Ctx = { params: Promise<{ pageKey: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const denied = await assertAdminSession();
  if (denied) return denied;

  const { pageKey } = await ctx.params;
  if (!KEYS.includes(pageKey as PageKey)) {
    return NextResponse.json({ error: "unknown page" }, { status: 404 });
  }
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ pageKey, persisted: false });
    }
    const content = await repoGetCmsPage(pageKey as PageKey);
    return NextResponse.json({ pageKey, content, persisted: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "failed to load page" }, { status: 500 });
  }
}

export async function PUT(req: Request, ctx: Ctx) {
  const denied = await assertAdminSession();
  if (denied) return denied;

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { ok: false, error: "Supabase не настроен — используйте локальное сохранение в браузере." },
      { status: 400 },
    );
  }

  const { pageKey } = await ctx.params;
  if (!KEYS.includes(pageKey as PageKey)) {
    return NextResponse.json({ error: "unknown page" }, { status: 404 });
  }

  const body = (await req.json()) as { title?: string; body?: string };
  const title = typeof body.title === "string" ? body.title : "";
  const pageBody = typeof body.body === "string" ? body.body : "";

  try {
    await repoPutCmsPage(pageKey as PageKey, title, pageBody);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "failed to save" }, { status: 500 });
  }
}
