import type { Product } from "@/lib/catalog-types";
import type { AdminProduct } from "@/lib/admin-types";
import { slugify } from "@/lib/product-utils";
import { readAdminDb } from "@/lib/server/admin-db";

/**
 * Находит запись админки для карточки витрины:
 * 1) по linkedCatalogProductId === product.id
 * 2) иначе по совпадению slug от названия
 */
export async function findAdminOverlayForCatalogProduct(
  product: Product,
): Promise<AdminProduct | undefined> {
  const db = await readAdminDb();
  const byId = db.products.find(
    (a) =>
      typeof a.linkedCatalogProductId === "string" &&
      a.linkedCatalogProductId.trim() === product.id,
  );
  if (byId) return byId;

  const slug = slugify(product.name);
  return db.products.find((a) => slugify(a.name) === slug);
}
