import path from "node:path";
import { config } from "dotenv";

config({ path: path.join(process.cwd(), ".env.local") });
config({ path: path.join(process.cwd(), ".env") });
import { createClient } from "@supabase/supabase-js";
import { PRODUCTS } from "@/lib/products";
import type { AdminProductCategory } from "@/lib/admin-types";

function required(name: string): string {
  const v = process.env[name];
  if (!v || !v.trim()) throw new Error(`Missing env: ${name}`);
  return v.trim();
}

function categoryFromType(t: string): AdminProductCategory {
  if (t === "monocular") return "thermal-monocular";
  if (t === "scope") return "thermal-scope";
  return "other";
}

function nowIso() {
  return new Date().toISOString();
}

async function main() {
  const url = required("NEXT_PUBLIC_SUPABASE_URL");
  const service = required("SUPABASE_SERVICE_ROLE_KEY");
  const sb = createClient(url, service, { auth: { persistSession: false } });

  const t = nowIso();
  const rows = PRODUCTS.map((p) => ({
    id: `cat_${p.id}`,
    name: p.name,
    brand: p.brand,
    price_rub: p.priceRub,
    stock_qty: p.inStock ? 1 : 0,
    published: true,
    category: categoryFromType(p.type),
    magnification: `${p.magnificationMin}–${p.magnificationMax}×`,
    lens_diameter_mm: p.lensMm,
    in_stock: p.inStock,
    linked_catalog_product_id: p.id,
    description: "",
    specs_text: "",
    created_at: t,
    updated_at: t,
  }));

  // Best-effort: prefer one overlay per catalog product.
  // If the DB has a UNIQUE constraint on linked_catalog_product_id, we can upsert in bulk.
  // Otherwise, fall back to per-row (select by linked_catalog_product_id, then update/insert).
  let adopted = 0;
  const chunkSize = 200;
  const bulk = await sb.from("admin_products").upsert(rows.slice(0, chunkSize), {
    onConflict: "linked_catalog_product_id",
    ignoreDuplicates: false,
  });
  if (!bulk.error) {
    adopted += rows.slice(0, chunkSize).length;
    for (let i = chunkSize; i < rows.length; i += chunkSize) {
      const chunk = rows.slice(i, i + chunkSize);
      const res = await sb.from("admin_products").upsert(chunk, {
        onConflict: "linked_catalog_product_id",
        ignoreDuplicates: false,
      });
      if (res.error) throw res.error;
      adopted += chunk.length;
    }
  } else if ((bulk.error as any)?.code === "42P10") {
    // No unique/exclusion constraint for ON CONFLICT; do manual adopt.
    for (const r of rows) {
      const linked = r.linked_catalog_product_id as string;
      const { data: existing, error: selErr } = await sb
        .from("admin_products")
        .select("id")
        .eq("linked_catalog_product_id", linked)
        .limit(1);
      if (selErr) throw selErr;
      const existingId = (existing ?? [])[0]?.id as string | undefined;
      if (existingId) {
        const { error: updErr } = await sb
          .from("admin_products")
          .update({ ...r, id: undefined })
          .eq("id", existingId);
        if (updErr) throw updErr;
      } else {
        const { error: insErr } = await sb.from("admin_products").insert(r);
        if (insErr) throw insErr;
      }
      adopted += 1;
    }
  } else {
    throw bulk.error;
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        adopted,
        note:
          "Готово. Все товары из src/lib/products.ts теперь есть в admin_products и видны в /admin/products/crud.",
      },
      null,
      2,
    ),
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

