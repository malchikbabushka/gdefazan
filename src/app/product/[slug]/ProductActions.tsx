"use client";

import { useState } from "react";
import { ShoppingCart, Minus, Plus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppCart } from "@/components/providers/AppProviders";

export function ProductActions({ productId }: { productId: string }) {
  const cart = useAppCart();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const inCart = cart.state.items.find((i) => i.productId === productId);

  function handleAdd() {
    cart.add(productId, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <div className="flex items-center rounded-xl border border-white/10 bg-white/5">
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-l-xl text-zinc-300 hover:text-white"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <span className="w-10 text-center text-sm font-semibold text-zinc-50">
            {qty}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-r-xl text-zinc-300 hover:text-white"
            onClick={() => setQty((q) => q + 1)}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <Button
          className="h-10 flex-1 rounded-xl bg-yellow-400 text-sm font-semibold text-black hover:bg-yellow-300"
          onClick={handleAdd}
        >
          {added ? (
            <>
              <Check className="mr-2 h-4 w-4" /> Добавлено
            </>
          ) : (
            <>
              <ShoppingCart className="mr-2 h-4 w-4" /> В корзину
            </>
          )}
        </Button>
      </div>

      {inCart && (
        <p className="text-xs text-zinc-400">
          В корзине: {inCart.qty} шт.
        </p>
      )}
    </div>
  );
}
