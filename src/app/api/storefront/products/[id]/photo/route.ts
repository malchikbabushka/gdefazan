import { NextResponse } from "next/server";
import { isSupabaseAuthConfigured } from "@/lib/env/supabase";
import { createAnonClient } from "@/lib/supabase/anon";

type Ctx = { params: Promise<{ id: string }> };

type DbImageRow = { public_url: string; sort_order: number | null };

export async function GET(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const index = Math.max(
    0,
    Number.parseInt(new URL(req.url).searchParams.get("index") ?? "0", 10) || 0,
  );

  if (!isSupabaseAuthConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
  }

  try {
    const sb = createAnonClient();
    const res = await sb
      .from("product_images")
      .select("public_url, sort_order")
      .eq("product_id", id)
      .order("sort_order", { ascending: true });
    if (res.error) throw res.error;

    const rows = (res.data ?? []) as DbImageRow[];
    const url = rows[index]?.public_url;
    if (!url) return NextResponse.json({ error: "not found" }, { status: 404 });

    const target =
      url.startsWith("/") || url.startsWith("//")
        ? new URL(url, new URL(req.url).origin).toString()
        : url;
    return NextResponse.redirect(target);
  } catch (e) {
    console.error("[GET /api/storefront/products/[id]/photo]", e);
    return NextResponse.json({ error: "failed to load photo" }, { status: 500 });
  }
}
