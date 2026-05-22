import { cache } from "react";
import type { AdminOrder, AdminOrderItem, AdminProduct, AdminProductCategory } from "@/lib/admin-types";
import { isSupabaseConfigured } from "@/lib/env/supabase";
import { readAdminDb, writeAdminDb } from "@/lib/server/admin-db";
import { slugify } from "@/lib/product-utils";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import type { PageContent, PageKey } from "@/lib/pages-store";
import { DEFAULT_PAGES } from "@/lib/pages-store";
import type { SiteConfig } from "@/lib/site-config";
import { DEFAULT_SITE_CONFIG } from "@/lib/site-config";
import { withTimeout } from "@/lib/server/with-timeout";
import { randomUUID } from "node:crypto";
import sharp from "sharp";

export const PRODUCT_IMAGES_BUCKET = "product-images";

function isPublicPhotoUrl(u: string) {
  return u.startsWith("/") || u.startsWith("http://") || u.startsWith("https://");
}

function nowIso() {
  return new Date().toISOString();
}

function generateProductId() {
  return `p_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

function generateOrderId() {
  return `ord_${Date.now().toString(16)}_${Math.random().toString(16).slice(2, 10)}`;
}

function normalizeCategory(
  raw: string | undefined,
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

type DbImageRow = { public_url: string; sort_order: number; storage_path: string | null };

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

function rowToAdminProduct(row: DbProductRow, includePhotos: boolean): AdminProduct {
  const rawUrls = sortedImageUrls(row.product_images ?? undefined);
  const urls = includePhotos ? rawUrls : rawUrls.filter(isPublicPhotoUrl);
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
    photoCount: rawUrls.length,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapFileProductForList(p: AdminProduct, includePhotos: boolean): AdminProduct {
  const raw =
    Array.isArray(p.photoDataUrls) && p.photoDataUrls.length
      ? p.photoDataUrls.filter((u) => typeof u === "string" && u)
      : [];
  const stockQty =
    typeof p.stockQty === "number" && Number.isFinite(p.stockQty)
      ? Math.max(0, Math.floor(p.stockQty))
      : 0;
  const published = typeof p.published === "boolean" ? p.published : true;
  return {
    ...p,
    stockQty,
    published,
    photoDataUrls: includePhotos ? raw : raw.filter(isPublicPhotoUrl),
    photoCount: raw.length,
  };
}

async function sbReplaceProductImages(productId: string, urls: string[]) {
  const sb = createServiceRoleClient();
  await sb.from("product_images").delete().eq("product_id", productId);
  if (!urls.length) return;
  const rows = urls.map((public_url, sort_order) => {
    let storage_path: string | null = null;
    const marker = `/storage/v1/object/public/${PRODUCT_IMAGES_BUCKET}/`;
    const idx = public_url.indexOf(marker);
    if (idx !== -1) storage_path = public_url.slice(idx + marker.length);
    return { product_id: productId, sort_order, public_url, storage_path };
  });
  const { error } = await sb.from("product_images").insert(rows);
  if (error) throw error;
}

// --- Products ---

export async function repoListProducts(includePhotos: boolean): Promise<AdminProduct[]> {
  if (!isSupabaseConfigured()) {
    const db = await readAdminDb();
    return db.products.map((p) => mapFileProductForList(p, includePhotos));
  }
  const sb = createServiceRoleClient();
  const { data, error } = await sb
    .from("admin_products")
    .select(
      `
      id, name, brand, price_rub, stock_qty, published, category, magnification, lens_diameter_mm, in_stock,
      linked_catalog_product_id, description, specs_text, created_at, updated_at,
      product_images ( public_url, sort_order, storage_path )
    `,
    )
    .order("updated_at", { ascending: false });
  if (error) throw error;
  const rows = (data ?? []) as DbProductRow[];
  return rows.map((r) => rowToAdminProduct(r, includePhotos));
}

export async function repoGetProduct(
  id: string,
  includePhotos: boolean,
): Promise<AdminProduct | null> {
  if (!isSupabaseConfigured()) {
    const db = await readAdminDb();
    const p = db.products.find((x) => x.id === id);
    return p ? mapFileProductForList(p, includePhotos) : null;
  }
  const sb = createServiceRoleClient();
  const { data, error } = await sb
    .from("admin_products")
    .select(
      `
      id, name, brand, price_rub, stock_qty, published, category, magnification, lens_diameter_mm, in_stock,
      linked_catalog_product_id, description, specs_text, created_at, updated_at,
      product_images ( public_url, sort_order, storage_path )
    `,
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return rowToAdminProduct(data as DbProductRow, includePhotos);
}

export async function repoCreateProduct(body: Partial<AdminProduct>): Promise<AdminProduct> {
  const t = nowIso();
  const category = normalizeCategory(body.category, "thermal-scope");
  const linkedCatalogProductId =
    typeof body.linkedCatalogProductId === "string" && body.linkedCatalogProductId.trim()
      ? body.linkedCatalogProductId.trim()
      : null;
  const photoDataUrls = Array.isArray((body as { photoDataUrls?: unknown }).photoDataUrls)
    ? ((body as { photoDataUrls: unknown[] }).photoDataUrls as unknown[]).filter(
        (x): x is string => typeof x === "string",
      )
    : (body as { photoDataUrl?: string }).photoDataUrl
      ? [String((body as { photoDataUrl: string }).photoDataUrl)]
      : [];

  const stockQty =
    body.stockQty !== undefined && Number.isFinite(Number(body.stockQty))
      ? Math.max(0, Math.floor(Number(body.stockQty)))
      : 0;
  const published = body.published !== undefined ? Boolean(body.published) : true;

  const product: AdminProduct = {
    id: generateProductId(),
    name: String(body.name ?? ""),
    brand: String(body.brand ?? ""),
    priceRub: Number(body.priceRub ?? 0),
    stockQty,
    published,
    category,
    magnification: String(body.magnification ?? ""),
    lensDiameterMm: Number(body.lensDiameterMm ?? 0),
    inStock: Boolean(body.inStock ?? true),
    linkedCatalogProductId,
    description: String(body.description ?? ""),
    specsText: String(body.specsText ?? ""),
    photoDataUrls,
    createdAt: t,
    updatedAt: t,
  };

  if (!isSupabaseConfigured()) {
    const db = await readAdminDb();
    db.products.unshift(product);
    await writeAdminDb(db);
    return product;
  }

  const sb = createServiceRoleClient();
  const { error } = await sb.from("admin_products").insert({
    id: product.id,
    name: product.name,
    brand: product.brand,
    price_rub: product.priceRub,
    stock_qty: product.stockQty,
    published: product.published,
    category: product.category,
    magnification: product.magnification,
    lens_diameter_mm: product.lensDiameterMm,
    in_stock: product.inStock,
    linked_catalog_product_id: product.linkedCatalogProductId,
    description: product.description,
    specs_text: product.specsText,
    created_at: product.createdAt,
    updated_at: product.updatedAt,
  });
  if (error) throw error;
  await sbReplaceProductImages(product.id, photoDataUrls);
  return product;
}

export async function repoUpdateProduct(
  id: string,
  patch: Partial<AdminProduct>,
): Promise<AdminProduct | null> {
  const prev = await repoGetProduct(id, true);
  if (!prev) return null;
  const category =
    patch.category !== undefined
      ? normalizeCategory(patch.category, prev.category)
      : prev.category;
  const next: AdminProduct = {
    ...prev,
    name: patch.name !== undefined ? String(patch.name) : prev.name,
    brand: patch.brand !== undefined ? String(patch.brand) : prev.brand,
    priceRub: patch.priceRub !== undefined ? Number(patch.priceRub) : prev.priceRub,
    stockQty:
      patch.stockQty !== undefined && Number.isFinite(Number(patch.stockQty))
        ? Math.max(0, Math.floor(Number(patch.stockQty)))
        : prev.stockQty,
    published: patch.published !== undefined ? Boolean(patch.published) : prev.published,
    category,
    magnification:
      patch.magnification !== undefined ? String(patch.magnification) : prev.magnification,
    lensDiameterMm:
      patch.lensDiameterMm !== undefined
        ? Number(patch.lensDiameterMm)
        : prev.lensDiameterMm,
    inStock: patch.inStock !== undefined ? Boolean(patch.inStock) : prev.inStock,
    linkedCatalogProductId:
      patch.linkedCatalogProductId !== undefined
        ? typeof patch.linkedCatalogProductId === "string" &&
          patch.linkedCatalogProductId.trim()
          ? patch.linkedCatalogProductId.trim()
          : null
        : prev.linkedCatalogProductId,
    description:
      patch.description !== undefined ? String(patch.description) : prev.description,
    specsText: patch.specsText !== undefined ? String(patch.specsText) : prev.specsText,
    photoDataUrls:
      (patch as { photoDataUrls?: string[] }).photoDataUrls !== undefined
        ? Array.isArray((patch as { photoDataUrls?: unknown }).photoDataUrls)
          ? ((patch as { photoDataUrls: unknown[] }).photoDataUrls as unknown[]).filter(
              (x): x is string => typeof x === "string",
            )
          : []
        : prev.photoDataUrls,
    updatedAt: nowIso(),
  };

  if (!isSupabaseConfigured()) {
    const db = await readAdminDb();
    const idx = db.products.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    const products = [...db.products];
    products[idx] = next;
    await writeAdminDb({ products, orders: db.orders });
    return next;
  }

  const sb = createServiceRoleClient();
  const { error } = await sb
    .from("admin_products")
    .update({
      name: next.name,
      brand: next.brand,
      price_rub: next.priceRub,
      stock_qty: next.stockQty,
      published: next.published,
      category: next.category,
      magnification: next.magnification,
      lens_diameter_mm: next.lensDiameterMm,
      in_stock: next.inStock,
      linked_catalog_product_id: next.linkedCatalogProductId,
      description: next.description,
      specs_text: next.specsText,
      updated_at: next.updatedAt,
    })
    .eq("id", id);
  if (error) throw error;
  await sbReplaceProductImages(id, next.photoDataUrls);
  return next;
}

export async function repoDeleteProduct(id: string): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    const db = await readAdminDb();
    const before = db.products.length;
    db.products = db.products.filter((p) => p.id !== id);
    if (db.products.length === before) return false;
    await writeAdminDb(db);
    return true;
  }
  const sb = createServiceRoleClient();
  const { data, error } = await sb.from("admin_products").delete().eq("id", id).select("id");
  if (error) throw error;
  return (data?.length ?? 0) > 0;
}

export type ProductBulkOp =
  | "delete"
  | "setInStock"
  | "setPublished"
  | "setStockQty"
  | "setPriceRub"
  | "adjustPricePercent"
  | "setCategory";

export type ProductBulkPayload = {
  inStock?: boolean;
  published?: boolean;
  stockQty?: number;
  priceRub?: number;
  percent?: number;
  category?: AdminProductCategory;
};

export async function repoBulkProducts(
  ids: string[],
  op: ProductBulkOp,
  payload: ProductBulkPayload = {},
): Promise<void> {
  const unique = [...new Set(ids.filter((x) => typeof x === "string" && x.length > 0))];
  if (!unique.length) return;

  if (op === "delete") {
    for (const id of unique) {
      await repoDeleteProduct(id);
    }
    return;
  }

  const t = nowIso();

  if (!isSupabaseConfigured()) {
    const db = await readAdminDb();
    let changed = false;
    for (const id of unique) {
      const idx = db.products.findIndex((p) => p.id === id);
      if (idx === -1) continue;
      const p = db.products[idx]!;
      const next: AdminProduct = { ...p, updatedAt: t };
      if (op === "setInStock" && payload.inStock !== undefined) next.inStock = payload.inStock;
      else if (op === "setPublished" && payload.published !== undefined)
        next.published = payload.published;
      else if (op === "setStockQty" && payload.stockQty !== undefined)
        next.stockQty = Math.max(0, Math.floor(payload.stockQty));
      else if (op === "setPriceRub" && payload.priceRub !== undefined)
        next.priceRub = Math.max(0, Number(payload.priceRub));
      else if (op === "adjustPricePercent" && payload.percent !== undefined)
        next.priceRub = Math.max(
          0,
          Math.round(next.priceRub * (1 + payload.percent / 100)),
        );
      else if (op === "setCategory" && payload.category !== undefined)
        next.category = normalizeCategory(payload.category, next.category);
      else continue;
      db.products[idx] = next;
      changed = true;
    }
    if (changed) await writeAdminDb(db);
    return;
  }

  const sb = createServiceRoleClient();
  if (op === "setInStock" && payload.inStock !== undefined) {
    const { error } = await sb
      .from("admin_products")
      .update({ in_stock: payload.inStock, updated_at: t })
      .in("id", unique);
    if (error) throw error;
    return;
  }
  if (op === "setPublished" && payload.published !== undefined) {
    const { error } = await sb
      .from("admin_products")
      .update({ published: payload.published, updated_at: t })
      .in("id", unique);
    if (error) throw error;
    return;
  }
  if (op === "setStockQty" && payload.stockQty !== undefined) {
    const v = Math.max(0, Math.floor(payload.stockQty));
    const { error } = await sb
      .from("admin_products")
      .update({ stock_qty: v, updated_at: t })
      .in("id", unique);
    if (error) throw error;
    return;
  }
  if (op === "setPriceRub" && payload.priceRub !== undefined) {
    const v = Math.max(0, Number(payload.priceRub));
    const { error } = await sb
      .from("admin_products")
      .update({ price_rub: v, updated_at: t })
      .in("id", unique);
    if (error) throw error;
    return;
  }
  if (op === "setCategory" && payload.category !== undefined) {
    const c = normalizeCategory(payload.category, "thermal-scope");
    const { error } = await sb
      .from("admin_products")
      .update({ category: c, updated_at: t })
      .in("id", unique);
    if (error) throw error;
    return;
  }
  if (op === "adjustPricePercent" && payload.percent !== undefined) {
    const { data, error } = await sb
      .from("admin_products")
      .select("id, price_rub")
      .in("id", unique);
    if (error) throw error;
    for (const row of data ?? []) {
      const rid = (row as { id: string }).id;
      const pr = Number((row as { price_rub: number | string }).price_rub);
      const newPrice = Math.max(0, Math.round(pr * (1 + payload.percent! / 100)));
      const { error: uerr } = await sb
        .from("admin_products")
        .update({ price_rub: newPrice, updated_at: t })
        .eq("id", rid);
      if (uerr) throw uerr;
    }
  }
}

// --- Merge / PDP ---

async function loadProductsForMerge(): Promise<AdminProduct[]> {
  try {
    const all = await repoListProducts(true);
    return all.filter((p) => p.published);
  } catch (e) {
    console.error(
      "[loadProductsForMerge] Supabase недоступен или схема не применена — витрина без оверлея админки. npm run supabase:push или supabase/README.md",
      e,
    );
    return [];
  }
}

export const readAdminProductsForMergeCached = cache(loadProductsForMerge);

export async function repoFindAdminProductBySlug(slug: string): Promise<AdminProduct | undefined> {
  try {
    const products = await repoListProducts(true);
    const p = products.find((x) => slugify(x.name) === slug);
    if (!p || !p.published) return undefined;
    return p;
  } catch (e) {
    console.error("[repoFindAdminProductBySlug]", e);
    return undefined;
  }
}

/**
 * Быстрый поиск оверлея админки для товара витрины без загрузки всей таблицы.
 * 1) linked_catalog_product_id === catalogId
 * 2) name+brand (точное совпадение)
 */
export async function repoFindAdminOverlayForCatalog(
  input: { catalogId: string; name: string; brand: string },
): Promise<AdminProduct | undefined> {
  if (!isSupabaseConfigured()) {
    // Demo JSON: используем кэшированный список (малый объём).
    const products = await readAdminProductsForMergeCached();
    const byId = products.find((p) => p.linkedCatalogProductId?.trim() === input.catalogId);
    if (byId) return byId;
    return products.find((p) => p.name === input.name && p.brand === input.brand);
  }

  try {
    const sb = createServiceRoleClient();
    if (input.catalogId.trim()) {
      const res = await sb
        .from("admin_products")
        .select(
          `
          id, name, brand, price_rub, stock_qty, published, category, magnification, lens_diameter_mm, in_stock,
          linked_catalog_product_id, description, specs_text, created_at, updated_at,
          product_images ( public_url, sort_order, storage_path )
        `,
        )
        .eq("linked_catalog_product_id", input.catalogId.trim())
        .eq("published", true)
        .maybeSingle();
      if (res.error) throw res.error;
      if (res.data) return rowToAdminProduct(res.data as DbProductRow, true);
    }

    // Fallback: exact name+brand match (cheap, indexed if you add it later).
    const res2 = await sb
      .from("admin_products")
      .select(
        `
        id, name, brand, price_rub, stock_qty, published, category, magnification, lens_diameter_mm, in_stock,
        linked_catalog_product_id, description, specs_text, created_at, updated_at,
        product_images ( public_url, sort_order, storage_path )
      `,
      )
      .eq("name", input.name)
      .eq("brand", input.brand)
      .eq("published", true)
      .limit(1);
    if (res2.error) throw res2.error;
    const row = (res2.data ?? [])[0] as DbProductRow | undefined;
    return row ? rowToAdminProduct(row, true) : undefined;
  } catch (e) {
    console.error("[repoFindAdminOverlayForCatalog]", e);
    return undefined;
  }
}

// --- Stats ---

export async function repoGetStats() {
  if (!isSupabaseConfigured()) {
    const db = await readAdminDb();
    const inStockCount = db.products.filter((p) => p.inStock).length;
    const totalProducts = db.products.length;
    const now = Date.now();
    const days30 = 30 * 24 * 60 * 60 * 1000;
    const recentOrders = db.orders.filter((o) => {
      const t = new Date(o.createdAt).getTime();
      return Number.isFinite(t) && now - t <= days30;
    });
    return {
      revenueRub: recentOrders.reduce((sum, o) => sum + (Number(o.totalRub) || 0), 0),
      ordersCount: recentOrders.length,
      inStockCount,
      totalProducts,
    };
  }
  const sb = createServiceRoleClient();
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const [inStockRes, totalRes, ordersRes] = await Promise.all([
    sb.from("admin_products").select("*", { count: "exact", head: true }).eq("in_stock", true),
    sb.from("admin_products").select("*", { count: "exact", head: true }),
    sb.from("orders").select("total_rub").gte("created_at", since),
  ]);
  const orders = ordersRes.data ?? [];
  const revenueRub = orders.reduce((s, r) => s + Number((r as { total_rub: number }).total_rub), 0);
  return {
    revenueRub,
    ordersCount: orders.length,
    inStockCount: inStockRes.count ?? 0,
    totalProducts: totalRes.count ?? 0,
  };
}

// --- Photo proxy ---

export async function repoGetProductPhotoSource(
  productId: string,
  index: number,
): Promise<
  | { kind: "data"; mime: string; buffer: Buffer }
  | { kind: "redirect"; url: string }
  | null
> {
  const product = await repoGetProduct(productId, true);
  if (!product) return null;
  const urls = product.photoDataUrls.filter((u) => typeof u === "string" && u.length > 0);
  const src = urls[index];
  if (!src) return null;
  if (src.startsWith("data:")) {
    const parsed = parseDataUrl(src);
    if (!parsed) return null;
    return { kind: "data", mime: parsed.mime, buffer: parsed.buffer };
  }
  if (src.startsWith("http://") || src.startsWith("https://")) {
    return { kind: "redirect", url: src };
  }
  if (src.startsWith("/")) {
    return { kind: "redirect", url: src };
  }
  return null;
}

function parseDataUrl(dataUrl: string): { mime: string; buffer: Buffer } | null {
  const m = dataUrl.match(/^data:([^;,]+)(;base64)?,([\s\S]+)$/);
  if (!m?.[3]) return null;
  const mime = m[1]!;
  const isBase64 = m[2] === ";base64";
  const payload = m[3]!;
  if (isBase64) {
    try {
      return { mime, buffer: Buffer.from(payload, "base64") };
    } catch {
      return null;
    }
  }
  try {
    return { mime, buffer: Buffer.from(decodeURIComponent(payload), "utf8") };
  } catch {
    return null;
  }
}

// --- Orders ---

type OrderRow = {
  id: string;
  status: string;
  total_rub: number | string;
  customer_email: string | null;
  customer_phone: string | null;
  customer_name: string | null;
  notes: string | null;
  created_at: string;
  order_items?: Array<{
    product_id: string | null;
    product_name: string;
    quantity: number;
    price_rub: number | string;
  }> | null;
};

function mapOrderRow(row: OrderRow): AdminOrder {
  const items: AdminOrderItem[] | undefined = row.order_items?.length
    ? row.order_items.map((it) => ({
        productId: it.product_id,
        productName: it.product_name,
        quantity: it.quantity,
        priceRub: Number(it.price_rub),
      }))
    : undefined;
  return {
    id: row.id,
    totalRub: Number(row.total_rub),
    createdAt: row.created_at,
    status: row.status,
    customerEmail: row.customer_email,
    customerPhone: row.customer_phone,
    customerName: row.customer_name,
    notes: row.notes,
    items,
  };
}

export async function repoListOrders(): Promise<AdminOrder[]> {
  if (!isSupabaseConfigured()) {
    const db = await readAdminDb();
    return [...db.orders].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }
  const sb = createServiceRoleClient();
  const { data, error } = await sb
    .from("orders")
    .select(
      `
      id, status, total_rub, customer_email, customer_phone, customer_name, notes, created_at,
      order_items ( product_id, product_name, quantity, price_rub )
    `,
    )
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as OrderRow[] | null)?.map(mapOrderRow) ?? [];
}

export async function repoGetOrder(id: string): Promise<AdminOrder | null> {
  if (!isSupabaseConfigured()) {
    const db = await readAdminDb();
    return db.orders.find((o) => o.id === id) ?? null;
  }
  const sb = createServiceRoleClient();
  const { data, error } = await sb
    .from("orders")
    .select(
      `
      id, status, total_rub, customer_email, customer_phone, customer_name, notes, created_at,
      order_items ( product_id, product_name, quantity, price_rub )
    `,
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return mapOrderRow(data as OrderRow);
}

export async function repoRecordOrder(input: {
  totalRub: number;
  customer: { name?: string; phone?: string; email?: string; address?: string };
  items: Array<{ productId: string; name: string; priceRub: number; qty: number }>;
}): Promise<string> {
  const id = generateOrderId();
  const t = nowIso();
  const notes = input.customer.address?.trim() || null;

  const order: AdminOrder = {
    id,
    totalRub: input.totalRub,
    createdAt: t,
    status: "new",
    customerName: input.customer.name?.trim() || null,
    customerPhone: input.customer.phone?.trim() || null,
    customerEmail: input.customer.email?.trim() || null,
    notes,
    items: input.items.map((it) => ({
      productId: it.productId,
      productName: it.name,
      quantity: it.qty,
      priceRub: it.priceRub,
    })),
  };

  if (!isSupabaseConfigured()) {
    const db = await readAdminDb();
    db.orders.unshift(order);
    await writeAdminDb(db);
    return id;
  }

  const sb = createServiceRoleClient();
  const { error: oErr } = await sb.from("orders").insert({
    id,
    status: "new",
    total_rub: input.totalRub,
    customer_email: order.customerEmail,
    customer_phone: order.customerPhone,
    customer_name: order.customerName,
    notes: order.notes,
    created_at: t,
    updated_at: t,
  });
  if (oErr) throw oErr;
  const { error: iErr } = await sb.from("order_items").insert(
    input.items.map((it) => ({
      order_id: id,
      product_id: it.productId,
      product_name: it.name,
      quantity: it.qty,
      price_rub: it.priceRub,
    })),
  );
  if (iErr) throw iErr;
  return id;
}

// --- Site config & CMS ---

function deepMergeSiteConfig(stored: Record<string, unknown> | null | undefined): SiteConfig {
  if (!stored || typeof stored !== "object") return DEFAULT_SITE_CONFIG;
  const menu = Array.isArray(stored.menu) ? (stored.menu as SiteConfig["menu"]) : DEFAULT_SITE_CONFIG.menu;
  return {
    storeName: typeof stored.storeName === "string" ? stored.storeName : DEFAULT_SITE_CONFIG.storeName,
    logoText: typeof stored.logoText === "string" ? stored.logoText : DEFAULT_SITE_CONFIG.logoText,
    phone: typeof stored.phone === "string" ? stored.phone : DEFAULT_SITE_CONFIG.phone,
    email: typeof stored.email === "string" ? stored.email : DEFAULT_SITE_CONFIG.email,
    hours: typeof stored.hours === "string" ? stored.hours : DEFAULT_SITE_CONFIG.hours,
    menu: menu ?? DEFAULT_SITE_CONFIG.menu,
    homeLeadersProductIds: Array.isArray((stored as any).homeLeadersProductIds)
      ? ((stored as any).homeLeadersProductIds as unknown[]).filter(
          (x): x is string => typeof x === "string" && x.trim().length > 0,
        )
      : Array.isArray((stored as any).homeFeaturedProductIds)
        ? ((stored as any).homeFeaturedProductIds as unknown[]).filter(
            (x): x is string => typeof x === "string" && x.trim().length > 0,
          )
        : DEFAULT_SITE_CONFIG.homeLeadersProductIds,
  };
}

export async function repoGetSiteConfig(): Promise<SiteConfig> {
  if (!isSupabaseConfigured()) return DEFAULT_SITE_CONFIG;
  try {
    return await withTimeout(
      (async () => {
        const sb = createServiceRoleClient();
        const { data, error } = await sb
          .from("site_settings")
          .select("config")
          .eq("id", "default")
          .maybeSingle();
        if (error) throw error;
        const raw = data?.config as Record<string, unknown> | undefined;
        return deepMergeSiteConfig(raw);
      })(),
      8_000,
      "repoGetSiteConfig",
    );
  } catch (e) {
    console.error("[repoGetSiteConfig]", e);
    return DEFAULT_SITE_CONFIG;
  }
}

export async function repoPutSiteConfig(config: SiteConfig): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const sb = createServiceRoleClient();
  const { error } = await sb.from("site_settings").upsert({
    id: "default",
    config: config as unknown as Record<string, unknown>,
    updated_at: nowIso(),
  });
  if (error) throw error;
}

const CMS_KEYS: PageKey[] = ["warranty", "shipping-payment", "brands", "catalog", "home"];

export async function repoGetCmsPage(key: PageKey): Promise<PageContent> {
  const fallback = DEFAULT_PAGES[key];
  if (!isSupabaseConfigured()) return fallback;
  try {
    return await withTimeout(
      (async () => {
        const sb = createServiceRoleClient();
        const { data, error } = await sb
          .from("cms_pages")
          .select("title, body")
          .eq("page_key", key)
          .maybeSingle();
        if (error) throw error;
        if (!data) return fallback;
        return {
          title: typeof data.title === "string" && data.title.trim() ? data.title : fallback.title,
          body: typeof data.body === "string" ? data.body : fallback.body,
        };
      })(),
      8_000,
      `repoGetCmsPage(${key})`,
    );
  } catch (e) {
    console.error("[repoGetCmsPage]", key, e);
    return fallback;
  }
}

export async function repoPutCmsPage(key: PageKey, title: string, body: string): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const sb = createServiceRoleClient();
  const { error } = await sb.from("cms_pages").upsert({
    page_key: key,
    title,
    body,
    updated_at: nowIso(),
  });
  if (error) throw error;
}

export async function repoListAllCmsPages(): Promise<Partial<Record<PageKey, PageContent>>> {
  const out: Partial<Record<PageKey, PageContent>> = {};
  if (!isSupabaseConfigured()) return out;
  const sb = createServiceRoleClient();
  const { data, error } = await sb.from("cms_pages").select("page_key, title, body");
  if (error) throw error;
  for (const row of data ?? []) {
    const k = row.page_key as string;
    if (CMS_KEYS.includes(k as PageKey)) {
      out[k as PageKey] = {
        title: String(row.title ?? ""),
        body: String(row.body ?? ""),
      };
    }
  }
  return out;
}

// --- Storage upload ---

export async function repoUploadProductImageBuffers(
  productId: string,
  files: Array<{ buffer: Buffer; contentType: string; ext: string }>,
): Promise<string[]> {
  const sb = createServiceRoleClient();
  const { data: existing } = await sb
    .from("product_images")
    .select("sort_order")
    .eq("product_id", productId)
    .order("sort_order", { ascending: false })
    .limit(1);
  let start =
    existing?.[0] && typeof (existing[0] as { sort_order: number }).sort_order === "number"
      ? (existing[0] as { sort_order: number }).sort_order + 1
      : 0;

  const urls: string[] = [];
  const bucket = PRODUCT_IMAGES_BUCKET;
  const pub = process.env.NEXT_PUBLIC_SUPABASE_URL!.replace(/\/$/, "");

  for (const file of files) {
    // Always generate optimized variants for storefront performance.
    // We store the 960w WebP as the "public_url" used by the app by default.
    const base = `${productId}/${randomUUID()}`;
    const thumbPath = `${base}_w320.webp`;
    const mainPath = `${base}_w960.webp`;

    const input = sharp(file.buffer, { failOn: "none" }).rotate();
    const thumb = await input
      .clone()
      .resize({ width: 320, withoutEnlargement: true })
      .webp({ quality: 72 })
      .toBuffer();
    const main = await input
      .clone()
      .resize({ width: 960, withoutEnlargement: true })
      .webp({ quality: 78 })
      .toBuffer();

    const { error: upThumbErr } = await sb.storage.from(bucket).upload(thumbPath, thumb, {
      contentType: "image/webp",
      upsert: false,
    });
    if (upThumbErr) throw upThumbErr;
    const { error: upMainErr } = await sb.storage.from(bucket).upload(mainPath, main, {
      contentType: "image/webp",
      upsert: false,
    });
    if (upMainErr) throw upMainErr;

    const publicUrl = `${pub}/storage/v1/object/public/${bucket}/${mainPath}`;
    const { error: insErr } = await sb.from("product_images").insert({
      product_id: productId,
      sort_order: start++,
      storage_path: mainPath,
      public_url: publicUrl,
    });
    if (insErr) throw insErr;
    urls.push(publicUrl);
  }
  return urls;
}
