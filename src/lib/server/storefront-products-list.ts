import type { AdminProduct } from "@/lib/admin-types";
import { isSupabaseAuthConfigured, isSupabaseConfigured } from "@/lib/env/supabase";
import { readAdminDb } from "@/lib/server/admin-db";
import { repoListProducts } from "@/lib/server/admin-repository";
import { createAnonClient } from "@/lib/supabase/anon";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

type DbImageRow = { public_url: string; sort_order: number | null };

type DbProductRow = {
  id: string;
  name: string;
  brand: string;
  price_rub: number | string;
  stock_qty?: number | null;
  published?: boolean | null;
  category: string;
  magnification: string;
  lens_diameter_mm: number;
  in_stock: boolean;
  linked_catalog_product_id: string | null;
  description: string;
  specs_text: string;
  created_at: string;
  updated_at: string;
  product_images?: DbImageRow[] | null;
};

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
  return {
    id: row.id,
    name: row.name,
    brand: row.brand,
    priceRub: Number(row.price_rub),
    stockQty,
    published: row.published !== false,
    category: (row.category as AdminProduct["category"]) || "thermal-scope",
    magnification: row.magnification ?? "",
    lensDiameterMm: Number(row.lens_diameter_mm ?? 0),
    inStock: Boolean(row.in_stock),
    linkedCatalogProductId: row.linked_catalog_product_id?.trim() || null,
    description: row.description ?? "",
    specsText: row.specs_text ?? "",
    photoDataUrls: urls,
    photoCount: urls.length,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const SELECT = `
  id, name, brand, price_rub, stock_qty, published, category, magnification, lens_diameter_mm, in_stock,
  linked_catalog_product_id, description, specs_text, created_at, updated_at,
  product_images ( public_url, sort_order )
`;

async function listFromAnon(): Promise<AdminProduct[]> {
  const sb = createAnonClient();
  const res = await sb
    .from("admin_products")
    .select(SELECT)
    .eq("published", true)
    .order("updated_at", { ascending: false });
  if (res.error) throw res.error;
  return ((res.data ?? []) as DbProductRow[]).map(rowToAdminProduct);
}

async function listFromServiceRole(): Promise<AdminProduct[]> {
  const sb = createServiceRoleClient();
  const res = await sb
    .from("admin_products")
    .select(SELECT)
    .eq("published", true)
    .order("updated_at", { ascending: false });
  if (res.error) throw res.error;
  return ((res.data ?? []) as DbProductRow[]).map(rowToAdminProduct);
}

async function listFromFile(): Promise<AdminProduct[]> {
  const db = await readAdminDb();
  return db.products.filter((p) => p.published !== false);
}

export type StorefrontListResult = {
  products: AdminProduct[];
  source: "anon" | "service_role" | "repository" | "file" | "none";
  error?: string;
};

/** Список товаров для витрины: anon → service_role → repo → файл на диске. */
export async function listPublishedStorefrontProducts(): Promise<StorefrontListResult> {
  if (isSupabaseAuthConfigured()) {
    try {
      const products = await listFromAnon();
      if (products.length) return { products, source: "anon" };
    } catch (e) {
      console.error("[storefront] anon:", e);
    }
  }

  if (isSupabaseConfigured()) {
    try {
      const products = await listFromServiceRole();
      if (products.length) return { products, source: "service_role" };
    } catch (e) {
      console.error("[storefront] service_role:", e);
    }

    try {
      const all = await repoListProducts(false);
      const products = all.filter((p) => p.published !== false);
      if (products.length) return { products, source: "repository" };
    } catch (e) {
      console.error("[storefront] repository:", e);
    }
  }

  try {
    const products = await listFromFile();
    if (products.length) {
      return { products, source: "file" };
    }
  } catch (e) {
    console.error("[storefront] file:", e);
  }

  return {
    products: [],
    source: "none",
    error: "Supabase keys invalid or no published products. Fix .env.production and pm2 restart.",
  };
}
