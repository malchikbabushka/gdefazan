import type { AdminProduct } from "@/lib/admin-types";
import type { Product } from "@/lib/catalog-types";

export type StorefrontCatalog = {
  products: Product[];
  adminProducts: AdminProduct[];
};
