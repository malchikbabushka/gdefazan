import { NextResponse } from "next/server";
import type { AdminProduct, AdminProductCategory } from "@/lib/admin-types";
import { isSupabaseAuthConfigured } from "@/lib/env/supabase";
import { createAnonClient } from "@/lib/supabase/anon";

/** Публичный каталог для витрины (без «admin» в URL — иначе режут AdBlock/uBlock). */
export const dynamic = "force-dynamic";

type DbImageRow = { public_url: string; sort_order: number | null };

type DbProductRow = {
  id: string;
  name: string;
  brand: string;
  price_rub: number | string;
  stock_qty?: number | null;
  published?: boolean | null;
  category: string | null;
  magnification: string | null;
  lens_diameter_mm: number | null;
  in_stock: boolean | null;
  linked_catalog_product_id: string | null;
  description: string | null;
  specs_text: string | null;
  created_at: string;
  updated_at: string;
  product_images?: DbImageRow[] | null;
};

function normalizeCategory(
  raw: string | null | undefined,
  fallback: AdminProductCategory,
): AdminProductCategory {
  if (
    raw === "thermal-monocular" ||
    raw === "thermal-scope" ||
    raw === "optical" ||
    raw === "collimator" ||
    raw === "other"
  ) {
    return raw;
  }
  return fallback;
}

function sortedImageUrls(images: DbImageRow[] | null | undefined): string[] {
  if (!images?.length) return [];
  return [...images]
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map((i) => i.public_url)
    .filter((u): u is string => typeof u === "string" && u.length > 0);
}

function rowToAdminProduct(row: DbProductRow): AdminProduct {
  const urls = sortedImageUrls(row.product_images ?? undefined);
  const sq = row.stock_qty;
  const stockQty =
    typeof sq === "number" && Number.isFinite(sq) ? Math.max(0, Math.floor(sq)) : 0;
  const published = row.published !== false;
  return {
    id: row.id,
    name: row.name,
    brand: row.brand,
    priceRub: Number(row.price_rub),
    stockQty,
    published,
    category: normalizeCategory(row.category, "thermal-scope"),
    magnification: row.magnification ?? "",
    lensDiameterMm: Number(row.lens_diameter_mm ?? 0),
    inStock: Boolean(row.in_stock),
    linkedCatalogProductId: row.linked_catalog_product_id?.trim()
      ? row.linked_catalog_product_id.trim()
      : null,
    description: row.description ?? "",
    specsText: row.specs_text ?? "",
    photoDataUrls: urls,
    photoCount: urls.length,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function GET() {
  if (!isSupabaseAuthConfigured()) {
    return NextResponse.json(
      { products: [], error: "Supabase is not configured" },
      {
        status: 503,
        headers: { "Cache-Control": "private, no-store, max-age=0" },
      },
    );
  }

  try {
    const sb = createAnonClient();
    const res = await sb
      .from("admin_products")
      .select(
        `
        id, name, brand, price_rub, stock_qty, published, category, magnification, lens_diameter_mm, in_stock,
        linked_catalog_product_id, description, specs_text, created_at, updated_at,
        product_images ( public_url, sort_order )
      `,
      )
      .eq("published", true)
      .order("updated_at", { ascending: false });

    if (res.error) throw res.error;
    const rows = (res.data ?? []) as DbProductRow[];
    return NextResponse.json(
      { products: rows.map(rowToAdminProduct) },
      { headers: { "Cache-Control": "private, no-store, max-age=0" } },
    );
  } catch (e) {
    console.error("[GET /api/storefront/products]", e);
    const message = e instanceof Error ? e.message : "unknown";
    return NextResponse.json(
      { products: [], error: message },
      {
        status: 503,
        headers: { "Cache-Control": "private, no-store, max-age=0" },
      },
    );
  }
}
