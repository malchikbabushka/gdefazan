/**
 * One-shot import from data/admin-db.json into Supabase (service role).
 * Usage: set env in .env.local then `npm run migrate:admin`
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) {
    console.error("Need NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  const filePath = path.join(process.cwd(), "data", "admin-db.json");
  const raw = await readFile(filePath, "utf8");
  const db = JSON.parse(raw) as {
    products?: Array<{
      id: string;
      name: string;
      brand: string;
      priceRub?: number;
      category?: string;
      magnification?: string;
      lensDiameterMm?: number;
      inStock?: boolean;
      stockQty?: number;
      published?: boolean;
      linkedCatalogProductId?: string | null;
      description?: string;
      specsText?: string;
      photoDataUrls?: string[];
      createdAt?: string;
      updatedAt?: string;
    }>;
    orders?: Array<{
      id: string;
      totalRub: number;
      createdAt: string;
      status?: string;
      customerEmail?: string | null;
      customerPhone?: string | null;
      customerName?: string | null;
      notes?: string | null;
      items?: Array<{
        productId: string | null;
        productName: string;
        quantity: number;
        priceRub: number;
      }>;
    }>;
  };

  const sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

  const products = Array.isArray(db.products) ? db.products : [];
  for (const p of products) {
    const t = p.updatedAt ?? p.createdAt ?? new Date().toISOString();
    const { error } = await sb.from("admin_products").upsert({
      id: p.id,
      name: p.name,
      brand: p.brand,
      price_rub: Number(p.priceRub ?? 0),
      category: p.category ?? "thermal-scope",
      magnification: p.magnification ?? "",
      lens_diameter_mm: Number(p.lensDiameterMm ?? 0),
      in_stock: Boolean(p.inStock ?? true),
      stock_qty:
        p.stockQty !== undefined && Number.isFinite(Number(p.stockQty))
          ? Math.max(0, Math.floor(Number(p.stockQty)))
          : 0,
      published: p.published !== false,
      linked_catalog_product_id: p.linkedCatalogProductId ?? null,
      description: p.description ?? "",
      specs_text: p.specsText ?? "",
      created_at: p.createdAt ?? t,
      updated_at: t,
    });
    if (error) {
      console.error("product", p.id, error.message);
      continue;
    }
    await sb.from("product_images").delete().eq("product_id", p.id);
    const urls = Array.isArray(p.photoDataUrls)
      ? p.photoDataUrls.filter((u): u is string => typeof u === "string" && u.length > 0)
      : [];
    if (urls.length) {
      const rows = urls.map((public_url, sort_order) => ({
        product_id: p.id,
        sort_order,
        public_url,
        storage_path: null as string | null,
      }));
      const { error: imgErr } = await sb.from("product_images").insert(rows);
      if (imgErr) console.error("images", p.id, imgErr.message);
    }
  }

  const orders = Array.isArray(db.orders) ? db.orders : [];
  for (const o of orders) {
    const { error } = await sb.from("orders").upsert({
      id: o.id,
      status: o.status ?? "new",
      total_rub: Number(o.totalRub ?? 0),
      customer_email: o.customerEmail ?? null,
      customer_phone: o.customerPhone ?? null,
      customer_name: o.customerName ?? null,
      notes: o.notes ?? null,
      created_at: o.createdAt,
      updated_at: o.createdAt,
    });
    if (error) {
      console.error("order", o.id, error.message);
      continue;
    }
    await sb.from("order_items").delete().eq("order_id", o.id);
    const items = Array.isArray(o.items) ? o.items : [];
    if (items.length) {
      const { error: iErr } = await sb.from("order_items").insert(
        items.map((it) => ({
          order_id: o.id,
          product_id: it.productId,
          product_name: it.productName,
          quantity: it.quantity,
          price_rub: it.priceRub,
        })),
      );
      if (iErr) console.error("order_items", o.id, iErr.message);
    }
  }

  console.log(`Imported ${products.length} products, ${orders.length} orders.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
