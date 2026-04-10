import type { AdminProduct } from "./admin-types";
import type { Product } from "./catalog-types";
import { PRODUCTS } from "./products";

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9а-яё]+/gi, "-")
    .replace(/(^-|-$)/g, "");
}

export function findProductBySlug(slug: string): Product | undefined {
  return PRODUCTS.find((p) => slugify(p.name) === slug);
}

const compactName = (s: string) => s.toLowerCase().replace(/\s+/g, "");

/**
 * Связь админ-товара с карточкой витрины (имена часто расходятся: «MM06-50 LRF» vs «Sytong MM06-50LRF»).
 */
export function adminProductMatchesCatalogProduct(
  a: AdminProduct,
  p: Product,
): boolean {
  const linked =
    typeof a.linkedCatalogProductId === "string" && a.linkedCatalogProductId.trim()
      ? a.linkedCatalogProductId.trim()
      : null;
  if (linked && linked === p.id) return true;
  if (linked && linked === slugify(p.name)) return true;
  if (`a_${a.id}` === p.id) return true;
  if (slugify(a.name) === slugify(p.name)) return true;

  const ab = a.brand.toLowerCase();
  const pb = p.brand.toLowerCase();
  const brandOk = ab === pb || ab.includes(pb) || pb.includes(ab);
  if (!brandOk) return false;

  const an = compactName(a.name);
  const pn = compactName(p.name);
  if (an.length < 4 || pn.length < 4) return false;
  return an.includes(pn) || pn.includes(an);
}

export function getProductUrl(product: Product): string {
  return `/product/${slugify(product.name)}`;
}

export function getCategoryLabel(type: Product["type"]): string {
  return type === "scope" ? "Тепловизионные прицелы" : "Тепловизионные монокуляры";
}

export function getCategoryPath(type: Product["type"]): string {
  return type === "scope" ? "/catalog/thermal-scopes" : "/catalog/thermal-monoculars";
}
