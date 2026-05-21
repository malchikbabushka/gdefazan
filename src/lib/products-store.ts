"use client";

import { useEffect, useState } from "react";
import type { Product } from "@/lib/catalog-types";
import { PRODUCTS } from "@/lib/products";
import type { AdminProduct } from "@/lib/admin-types";
import { catalogProductsFromAdmin } from "@/lib/admin-catalog-map";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";

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

export function useProducts() {
  const [products, setProducts] = useState<Product[]>(PRODUCTS);
  const [adminProducts, setAdminProducts] = useState<AdminProduct[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    async function loadFromAdmin() {
      try {
        const r = await fetchWithTimeout("/api/admin/products", { cache: "no-store" }, 12_000);
        if (!r.ok) return;
        const data = (await r.json()) as { products?: AdminProduct[] };
        const admin = Array.isArray(data.products) ? data.products : [];
        setAdminProducts(admin);
        setProducts(catalogProductsFromAdmin(admin));
      } catch {
        /* ignore */
      }
    }

    void loadFromAdmin();
  }, [hydrated]);

  return { products, adminProducts, setProducts, hydrated };
}
