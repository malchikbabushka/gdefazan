import { NextResponse } from "next/server";
import type { AdminProduct } from "@/lib/admin-types";

export const dynamic = "force-dynamic";
import { isSupabaseAuthConfigured } from "@/lib/env/supabase";
import { assertAdminSession } from "@/lib/server/admin-auth";
import { repoDeleteProduct, repoGetProduct, repoUpdateProduct } from "@/lib/server/admin-repository";
import {
  AdminDemoFsReadOnlyError,
  safeClientErrorMessage,
} from "@/lib/server/admin-write-errors";
import { vercelAdminWritesBlockedResponse } from "@/lib/server/vercel-admin-write-guard";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  try {
    const url = new URL(req.url);
    const includePhotos =
      url.searchParams.get("includePhotos") === "1" ||
      url.searchParams.get("includePhotos") === "true";
    if (includePhotos && isSupabaseAuthConfigured()) {
      const denied = await assertAdminSession();
      if (denied) return denied;
    }
    const product = await repoGetProduct(id, includePhotos);
    if (!product) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json({ product });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "failed to load product" }, { status: 500 });
  }
}

export async function PUT(req: Request, ctx: Ctx) {
  const denied = await assertAdminSession();
  if (denied) return denied;

  const blocked = vercelAdminWritesBlockedResponse();
  if (blocked) return blocked;

  const { id } = await ctx.params;
  const patch = (await req.json()) as Partial<AdminProduct>;
  try {
    const next = await repoUpdateProduct(id, patch);
    if (!next) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json({ product: next });
  } catch (e) {
    console.error("[PUT /api/admin/products]", id, e);
    if (e instanceof AdminDemoFsReadOnlyError) {
      return NextResponse.json({ error: e.clientMessage }, { status: 503 });
    }
    const hint = safeClientErrorMessage(e);
    return NextResponse.json(
      { error: hint ?? "failed to update product" },
      { status: 500 },
    );
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const denied = await assertAdminSession();
  if (denied) return denied;

  const blocked = vercelAdminWritesBlockedResponse();
  if (blocked) return blocked;

  const { id } = await ctx.params;
  try {
    const ok = await repoDeleteProduct(id);
    if (!ok) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[DELETE /api/admin/products]", id, e);
    if (e instanceof AdminDemoFsReadOnlyError) {
      return NextResponse.json({ error: e.clientMessage }, { status: 503 });
    }
    const hint = safeClientErrorMessage(e);
    return NextResponse.json(
      { error: hint ?? "failed to delete product" },
      { status: 500 },
    );
  }
}
