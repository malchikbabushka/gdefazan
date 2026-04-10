"use client";

import { useEffect, useState } from "react";
import type { Product } from "@/lib/catalog-types";
import { PRODUCTS } from "@/lib/products";
import type { AdminProduct } from "@/lib/admin-types";
import { adminProductMatchesCatalogProduct } from "@/lib/product-utils";

const STORAGE_KEY = "thermal-shop:products:v1";

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
    const fromStorage = loadProductsFromStorage();
    if (fromStorage && Array.isArray(fromStorage) && fromStorage.length > 0) {
      setProducts(fromStorage);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    async function mergeAdminProducts() {
      try {
        const r = await fetch("/api/admin/products", { cache: "no-store" });
        if (!r.ok) return;
        const data = (await r.json()) as { products?: AdminProduct[] };
        const admin = Array.isArray(data.products) ? data.products : [];
        setAdminProducts(admin);

        setProducts((prev) => {
          const byId = new Map(prev.map((p) => [p.id, p] as const));

          // Overlay existing by linkedCatalogProductId or slug match.
          for (const a of admin) {
            const linked =
              typeof a.linkedCatalogProductId === "string" &&
              a.linkedCatalogProductId.trim()
                ? a.linkedCatalogProductId.trim()
                : null;
            if (linked && byId.has(linked)) {
              const base = byId.get(linked)!;
              byId.set(linked, {
                ...base,
                name: a.name || base.name,
                brand: a.brand || base.brand,
                priceRub: Number.isFinite(a.priceRub) ? a.priceRub : base.priceRub,
                inStock: a.inStock ?? base.inStock,
              });
              continue;
            }

            const match = prev.find((p) => adminProductMatchesCatalogProduct(a, p));
            if (match) {
              const base = byId.get(match.id)!;
              byId.set(match.id, {
                ...base,
                name: a.name || base.name,
                brand: a.brand || base.brand,
                priceRub: Number.isFinite(a.priceRub) ? a.priceRub : base.priceRub,
                inStock: a.inStock ?? base.inStock,
              });
              continue;
            }

            // Add as a new catalog item (best-effort defaults).
            if (a.category === "thermal-scope" || a.category === "thermal-monocular") {
              const id = `a_${a.id}`;
              if (byId.has(id)) continue;
              byId.set(id, {
                id,
                brand: a.brand || "Brand",
                name: a.name || "Product",
                type: a.category === "thermal-monocular" ? "monocular" : "scope",
                priceRub: Number(a.priceRub ?? 0),
                matrix: "640×512",
                lensMm: 35,
                magnificationMin: 1,
                magnificationMax: 4,
                hasRangefinder: false,
                inStock: Boolean(a.inStock ?? true),
                popularity: 50,
              });
            }
          }

          return Array.from(byId.values());
        });
      } catch {
        // ignore
      }
    }

    mergeAdminProducts();
    return () => {
    };
  }, [hydrated]);

  return { products, adminProducts, setProducts, hydrated };
}

