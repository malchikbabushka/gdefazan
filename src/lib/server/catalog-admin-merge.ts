import type { Product } from "@/lib/catalog-types";
import type { AdminProduct } from "@/lib/admin-types";
import { adminProductMatchesCatalogProduct, slugify } from "@/lib/product-utils";
import { readAdminProductsForMergeCached, repoFindAdminOverlayForCatalog } from "@/lib/server/admin-repository";

/**
 * Находит запись админки для карточки витрины:
 * 1) по linkedCatalogProductId === product.id
 * 2) иначе по совпадению slug от названия
 */
export async function findAdminOverlayForCatalogProduct(
  product: Product,
): Promise<AdminProduct | undefined> {
  // Fast path: avoid loading full admin_products list on PDP render.
  const fast = await repoFindAdminOverlayForCatalog({
    catalogId: product.id,
    name: product.name,
    brand: product.brand,
  });
  if (fast) return fast;

  const slug = slugify(product.name);
  const products = await readAdminProductsForMergeCached();
  const byNameSlug = products.find((a) => slugify(a.name) === slug);
  if (byNameSlug) return byNameSlug;

  return products.find((a) => adminProductMatchesCatalogProduct(a, product));
}
