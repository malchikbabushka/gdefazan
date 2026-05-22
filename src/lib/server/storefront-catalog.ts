import { catalogProductsFromAdmin } from "@/lib/admin-catalog-map";
import { repoListProducts } from "@/lib/server/admin-repository";
import type { StorefrontCatalog } from "@/lib/storefront-catalog-types";

export type { StorefrontCatalog } from "@/lib/storefront-catalog-types";

/** Каталог для витрины (только опубликованные). */
export async function getStorefrontCatalog(): Promise<StorefrontCatalog> {
  const all = await repoListProducts(false);
  const adminProducts = all.filter((p) => p.published !== false);
  return {
    adminProducts,
    products: catalogProductsFromAdmin(adminProducts),
  };
}
