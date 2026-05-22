import { NextResponse } from "next/server";
import type { AdminProduct } from "@/lib/admin-types";

/** Список товаров меняется из админки — не кэшировать на CDN/ISR. */
export const dynamic = "force-dynamic";
import { isSupabaseAuthConfigured } from "@/lib/env/supabase";
import { assertAdminSession } from "@/lib/server/admin-auth";
import { repoCreateProduct, repoListProducts } from "@/lib/server/admin-repository";
import {
  AdminDemoFsReadOnlyError,
  safeClientErrorMessage,
} from "@/lib/server/admin-write-errors";
import { vercelAdminWritesBlockedResponse } from "@/lib/server/vercel-admin-write-guard";
import { getSupabaseUser } from "@/lib/supabase/server-user";
import { withTimeout } from "@/lib/server/with-timeout";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const includePhotos =
    url.searchParams.get("includePhotos") === "1" ||
    url.searchParams.get("includePhotos") === "true";

  if (includePhotos && isSupabaseAuthConfigured()) {
    const denied = await assertAdminSession();
    if (denied) return denied;
  }

  try {
    let products = await withTimeout(
      repoListProducts(includePhotos),
      25_000,
      "repoListProducts",
    );
    if (isSupabaseAuthConfigured()) {
      const user = await getSupabaseUser();
      if (!user) {
        products = products.filter((p) => p.published);
      }
    }
    return NextResponse.json(
      { products },
      {
        headers: {
          "Cache-Control": "private, no-store, max-age=0",
        },
      },
    );
  } catch (e) {
    console.error("[GET /api/admin/products]", e);
    const message = e instanceof Error ? e.message : "unknown";
    return NextResponse.json(
      { products: [], error: message },
      {
        status: 503,
        headers: {
          "Cache-Control": "private, no-store, max-age=0",
        },
      },
    );
  }
}

export async function POST(req: Request) {
  const denied = await assertAdminSession();
  if (denied) return denied;

  const blocked = vercelAdminWritesBlockedResponse();
  if (blocked) return blocked;

  const body = (await req.json()) as Partial<AdminProduct>;

  if (!body.name || !body.brand) {
    return NextResponse.json({ error: "name и brand обязательны" }, { status: 400 });
  }

  try {
    const product = await repoCreateProduct(body);
    return NextResponse.json({ product }, { status: 201 });
  } catch (e) {
    console.error("[POST /api/admin/products]", e);
    if (e instanceof AdminDemoFsReadOnlyError) {
      return NextResponse.json({ error: e.clientMessage }, { status: 503 });
    }
    const hint = safeClientErrorMessage(e);
    return NextResponse.json(
      { error: hint ?? "failed to create product" },
      { status: 500 },
    );
  }
}
