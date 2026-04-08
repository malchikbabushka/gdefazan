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

export function getProductUrl(product: Product): string {
  return `/product/${slugify(product.name)}`;
}

export function getCategoryLabel(type: Product["type"]): string {
  return type === "scope" ? "Тепловизионные прицелы" : "Тепловизионные монокуляры";
}

export function getCategoryPath(type: Product["type"]): string {
  return type === "scope" ? "/catalog/thermal-scopes" : "/catalog/thermal-monoculars";
}
