"use client";

import React, { createContext, useContext, useMemo } from "react";
import type { Product } from "@/lib/catalog-types";
import type { AdminProduct } from "@/lib/admin-types";
import { useProducts } from "@/lib/products-store";
import { useCart } from "@/lib/cart-store";

type ProductsCtx = {
  products: Product[];
  adminProducts: AdminProduct[];
  hydrated: boolean;
};

type CartCtx = ReturnType<typeof useCart>;

const ProductsContext = createContext<ProductsCtx | null>(null);
const CartContext = createContext<CartCtx | null>(null);

export function AppProviders({ children }: { children: React.ReactNode }) {
  const productsStore = useProducts();
  const cart = useCart(productsStore.products);

  const productsValue = useMemo(
    () => ({
      products: productsStore.products,
      adminProducts: productsStore.adminProducts,
      hydrated: productsStore.hydrated,
    }),
    [productsStore.adminProducts, productsStore.hydrated, productsStore.products],
  );

  return (
    <ProductsContext.Provider value={productsValue}>
      <CartContext.Provider value={cart}>{children}</CartContext.Provider>
    </ProductsContext.Provider>
  );
}

export function useAppProducts() {
  const ctx = useContext(ProductsContext);
  if (!ctx) throw new Error("useAppProducts must be used within <AppProviders />");
  return ctx;
}

export function useAppCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useAppCart must be used within <AppProviders />");
  return ctx;
}

