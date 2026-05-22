"use client";

import { useEffect, useState } from "react";
import type { Product } from "@/lib/catalog-types";
import { PRODUCTS } from "@/lib/products";
import type { AdminProduct } from "@/lib/admin-types";
import type { StorefrontCatalog } from "@/lib/storefront-catalog-types";
import { fetchStorefrontCatalogClient } from "@/lib/storefront-catalog-client";

const STORAGE_KEY = "thermal-shop:products:v2";

export function loadProductsFromStorage(): Product[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Product[];
  } catch {
    return null;
  }
}

export function saveProductsToStorage(products: Product[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
}

export function useProducts(initial?: StorefrontCatalog) {
  const [products, setProducts] = useState<Product[]>(initial?.products ?? PRODUCTS);
  const [adminProducts, setAdminProducts] = useState<AdminProduct[]>(
    initial?.adminProducts ?? [],
  );
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    async function loadFromAdmin() {
      try {
        const data = await fetchStorefrontCatalogClient();
        if (!data) return;
        setAdminProducts(data.admin);
        setProducts(data.products);
      } catch {
        /* ignore */
      }
    }

    void loadFromAdmin();
  }, [hydrated]);

  return { products, adminProducts, setProducts, hydrated };
}
