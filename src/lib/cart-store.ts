"use client";

import { useEffect, useMemo, useState } from "react";
import type { Product } from "@/lib/catalog-types";

export type CartItem = {
  productId: string;
  qty: number;
};

export type CartState = {
  items: CartItem[];
};

const STORAGE_KEY = "thermal-shop:cart:v1";
const CART_EVENT = "thermal-shop:cart:changed";

function loadCart(): CartState {
  if (typeof window === "undefined") return { items: [] };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { items: [] };
    const parsed = JSON.parse(raw) as CartState;
    if (!parsed || !Array.isArray(parsed.items)) return { items: [] };
    return parsed;
  } catch {
    return { items: [] };
  }
}

function saveCart(state: CartState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function useCart(products: Product[]) {
  const [state, setState] = useState<CartState>({ items: [] });
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(loadCart());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    function syncFromStorage() {
      setState(loadCart());
    }

    // Cross-tab updates
    window.addEventListener("storage", syncFromStorage);
    // Same-tab updates (we dispatch this event on mutations)
    window.addEventListener(CART_EVENT, syncFromStorage as EventListener);
    return () => {
      window.removeEventListener("storage", syncFromStorage);
      window.removeEventListener(CART_EVENT, syncFromStorage as EventListener);
    };
  }, []);

  const itemsDetailed = useMemo(() => {
    const byId = new Map(products.map((p) => [p.id, p] as const));
    return state.items
      .map((it) => {
        const p = byId.get(it.productId);
        if (!p) return null;
        return { product: p, qty: it.qty };
      })
      .filter(Boolean) as Array<{ product: Product; qty: number }>;
  }, [products, state.items]);

  const count = useMemo(
    () => state.items.reduce((sum, it) => sum + it.qty, 0),
    [state.items],
  );

  const totalRub = useMemo(
    () => itemsDetailed.reduce((sum, it) => sum + it.product.priceRub * it.qty, 0),
    [itemsDetailed],
  );

  function add(productId: string, qty = 1) {
    if (!hydrated) return;
    setState((s) => {
      const items = [...s.items];
      const idx = items.findIndex((x) => x.productId === productId);
      if (idx >= 0) items[idx] = { productId, qty: items[idx]!.qty + qty };
      else items.push({ productId, qty });
      const next = { items };
      saveCart(next);
      window.dispatchEvent(new Event(CART_EVENT));
      return next;
    });
  }

  function setQty(productId: string, qty: number) {
    if (!hydrated) return;
    setState((s) => {
      const items = s.items
        .map((x) => (x.productId === productId ? { ...x, qty } : x))
        .filter((x) => x.qty > 0);
      const next = { items };
      saveCart(next);
      window.dispatchEvent(new Event(CART_EVENT));
      return next;
    });
  }

  function remove(productId: string) {
    if (!hydrated) return;
    setState((s) => {
      const next = { items: s.items.filter((x) => x.productId !== productId) };
      saveCart(next);
      window.dispatchEvent(new Event(CART_EVENT));
      return next;
    });
  }

  function clear() {
    if (!hydrated) return;
    const next = { items: [] };
    setState(next);
    saveCart(next);
    window.dispatchEvent(new Event(CART_EVENT));
  }

  return { hydrated, state, itemsDetailed, count, totalRub, add, setQty, remove, clear };
}

