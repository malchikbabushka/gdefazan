"use client";

import Link from "next/link";
import { ShoppingCart, Trash2 } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { formatRub } from "@/lib/catalog-logic";
import { useAppCart } from "@/components/providers/AppProviders";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function CartSheet() {
  const cart = useAppCart();

  return (
    <Sheet>
      <SheetTrigger className="inline-flex h-9 items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 text-xs font-semibold text-zinc-50 outline-none transition hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-yellow-400/30">
        <ShoppingCart className="h-4 w-4 text-yellow-100/80" />
        Корзина
        <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-yellow-400 px-1.5 text-[11px] font-bold text-black">
          {cart.count}
        </span>
      </SheetTrigger>
      <SheetContent side="right" className="border-white/10 bg-black/95">
        <SheetHeader>
          <SheetTitle className="text-zinc-50">Корзина</SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-3">
          {cart.itemsDetailed.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-zinc-200/70">
              Корзина пуста. Добавьте товары из каталога.
            </div>
          ) : (
            <>
              {cart.itemsDetailed.map(({ product, qty }) => (
                <div
                  key={product.id}
                  className="rounded-2xl border border-white/10 bg-white/5 p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-zinc-50">
                        {product.name}
                      </div>
                      <div className="mt-1 text-xs text-zinc-200/70">
                        {product.brand} • {product.matrix} • {product.lensMm} мм
                      </div>
                    </div>
                    <div className="text-right text-sm font-semibold text-yellow-100/90">
                      {formatRub(product.priceRub * qty)}
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="text-xs text-zinc-200/70">Кол-во</div>
                      <Input
                        value={String(qty)}
                        inputMode="numeric"
                        onChange={(e) => {
                          const next = Math.max(1, Number(e.currentTarget.value || 1));
                          cart.setQty(product.id, Number.isFinite(next) ? next : 1);
                        }}
                        className="h-9 w-20 rounded-xl border-white/10 bg-black/40 text-zinc-50"
                      />
                    </div>
                    <Button
                      variant="outline"
                      className="h-9 rounded-xl border-white/10 bg-white/5 text-zinc-50 hover:bg-white/10"
                      onClick={() => cart.remove(product.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Удалить
                    </Button>
                  </div>
                </div>
              ))}

              <Separator className="bg-white/10" />

              <div className="flex items-center justify-between text-sm">
                <div className="text-zinc-200/70">Итого</div>
                <div className="font-semibold text-zinc-50">{formatRub(cart.totalRub)}</div>
              </div>

              <div className="flex gap-2">
                <Link
                  href="/checkout"
                  className={cn(
                    buttonVariants({ size: "lg" }),
                    "h-11 flex-1 rounded-2xl bg-yellow-400 font-semibold text-black hover:bg-yellow-300",
                  )}
                >
                  Оформить
                </Link>
                <Button
                  variant="outline"
                  className="h-11 rounded-2xl border-white/10 bg-white/5 font-semibold text-zinc-50 hover:bg-white/10"
                  onClick={() => cart.clear()}
                >
                  Очистить
                </Button>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

