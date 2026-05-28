import { NextResponse } from "next/server";
import { listPublishedStorefrontProducts } from "@/lib/server/storefront-products-list";

/** Публичный каталог для витрины (без «admin» в URL — иначе режут AdBlock/uBlock). */
export const dynamic = "force-dynamic";

export async function GET() {
  const { products, source, error } = await listPublishedStorefrontProducts();
  return NextResponse.json(
    { products, source, ...(error ? { error } : {}) },
    {
      status: products.length ? 200 : 503,
      headers: { "Cache-Control": "private, no-store, max-age=0" },
    },
  );
}
