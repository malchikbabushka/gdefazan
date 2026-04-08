"use client";

import Link from "next/link";
import { useProducts } from "@/lib/products-store";
import { useCart } from "@/lib/cart-store";
import { formatRub } from "@/lib/catalog-logic";
import { Card, CardContent } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export default function CartPage() {
  const { products } = useProducts();
  const cart = useCart(products);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">Корзина</h1>
          <p className="mt-2 text-sm text-zinc-200/70">
            Проверьте товары и переходите к оформлению.
          </p>
        </div>
        <Link
          href="/catalog"
          className={cn(
            buttonVariants({ variant: "outline", size: "lg" }),
            "rounded-2xl border-white/10 bg-white/5 text-zinc-50 hover:bg-white/10",
          )}
        >
          В каталог
        </Link>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_420px]">
        <div className="space-y-3">
          {cart.itemsDetailed.length === 0 ? (
            <Card className="border-white/10 bg-white/5">
              <CardContent className="p-6 text-sm text-zinc-200/70">
                Корзина пуста. Добавьте товары из каталога.
              </CardContent>
            </Card>
          ) : (
            cart.itemsDetailed.map(({ product, qty }) => (
              <Card key={product.id} className="border-white/10 bg-white/5">
                <CardContent className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-zinc-50">
                        {product.name}
                      </div>
                      <div className="mt-1 text-xs text-zinc-200/70">
                        {product.brand} • {product.matrix} • {product.lensMm} мм
                      </div>
                    </div>
                    <div className="text-right text-sm font-semibold text-zinc-50">
                      {formatRub(product.priceRub * qty)}
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className="text-xs text-zinc-200/70">Кол-во</div>
                      <Input
                        value={String(qty)}
                        inputMode="numeric"
                        onChange={(e) => {
                          const next = Math.max(1, Number(e.currentTarget.value || 1));
                          cart.setQty(product.id, Number.isFinite(next) ? next : 1);
                        }}
                        className="h-10 w-24 rounded-2xl border-white/10 bg-black/40 text-zinc-50"
                      />
                    </div>
                    <Button
                      variant="outline"
                      className="h-10 rounded-2xl border-white/10 bg-white/5 text-zinc-50 hover:bg-white/10"
                      onClick={() => cart.remove(product.id)}
                    >
                      Удалить
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <aside className="h-fit">
          <Card className="border-white/10 bg-white/5">
            <CardContent className="p-5">
              <div className="text-sm font-semibold text-zinc-50">Итого</div>
              <Separator className="my-4 bg-white/10" />
              <div className="flex items-center justify-between text-sm">
                <div className="text-zinc-200/70">Сумма</div>
                <div className="font-semibold text-zinc-50">{formatRub(cart.totalRub)}</div>
              </div>
              <Link
                href="/checkout"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "mt-4 h-11 w-full rounded-2xl bg-yellow-400 font-semibold text-black hover:bg-yellow-300",
                )}
              >
                Оформить
              </Link>
              <Button
                variant="outline"
                className="mt-2 h-11 w-full rounded-2xl border-white/10 bg-white/5 font-semibold text-zinc-50 hover:bg-white/10"
                onClick={() => cart.clear()}
              >
                Очистить корзину
              </Button>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

