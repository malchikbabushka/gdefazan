import { catalogProductsFromAdmin } from "@/lib/admin-catalog-map";
import { listPublishedStorefrontProducts } from "@/lib/server/storefront-products-list";
import type { StorefrontCatalog } from "@/lib/storefront-catalog-types";

export type { StorefrontCatalog } from "@/lib/storefront-catalog-types";

/** Каталог для витрины (только опубликованные). */
export async function getStorefrontCatalog(): Promise<StorefrontCatalog> {
  const { products: adminProducts } = await listPublishedStorefrontProducts();
  return {
    adminProducts,
    products: catalogProductsFromAdmin(adminProducts),
  };
}
