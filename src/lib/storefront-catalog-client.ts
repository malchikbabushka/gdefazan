import type { AdminProduct } from "@/lib/admin-types";
import { catalogProductsFromAdmin } from "@/lib/admin-catalog-map";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";

async function fetchProductsJson(url: string) {
  const r = await fetchWithTimeout(url, { cache: "no-store" }, 12_000);
  if (!r.ok) return null;
  const data = (await r.json()) as { products?: AdminProduct[] };
  const admin = Array.isArray(data.products) ? data.products : [];
  return { admin, products: catalogProductsFromAdmin(admin) };
}

/** Обновление каталога в браузере: storefront API, затем legacy /api/admin/products. */
export async function fetchStorefrontCatalogClient() {
  const primary = await fetchProductsJson("/api/storefront/products");
  if (primary) return primary;
  return fetchProductsJson("/api/admin/products");
}
