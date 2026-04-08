"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useProducts } from "@/lib/products-store";
import { useCart } from "@/lib/cart-store";
import { formatRub } from "@/lib/catalog-logic";
import { Card, CardContent } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type PaymentMethod = "sberbank" | "mts-bank" | "evotor";

export default function CheckoutPage() {
  const { products } = useProducts();
  const cart = useCart(products);
  const [method, setMethod] = useState<PaymentMethod>("sberbank");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = useMemo(() => {
    return cart.itemsDetailed.length > 0 && name.trim() && phone.trim();
  }, [cart.itemsDetailed.length, name, phone]);

  async function onPay() {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/payment/create", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          method,
          customer: { name, phone, email, address },
          items: cart.itemsDetailed.map((x) => ({
            productId: x.product.id,
            name: x.product.name,
            priceRub: x.product.priceRub,
            qty: x.qty,
          })),
          totalRub: cart.totalRub,
        }),
      });
      if (!res.ok) throw new Error("payment_create_failed");
      const data = (await res.json()) as { ok: boolean; redirectUrl: string };
      if (!data?.ok || !data.redirectUrl) throw new Error("bad_response");
      cart.clear();
      window.location.href = data.redirectUrl;
    } catch {
      window.location.href = "/checkout/fail";
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">
            Оформление заказа
          </h1>
          <p className="mt-2 text-sm text-zinc-200/70">
            Демо-оплата: Сбербанк / МТС-Банк / Эвотор.
          </p>
        </div>
        <Link
          href="/catalog"
          className={cn(buttonVariants({ variant: "outline", size: "lg" }), "rounded-2xl border-white/10 bg-white/5 text-zinc-50 hover:bg-white/10")}
        >
          Вернуться в каталог
        </Link>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_420px]">
        <div className="space-y-6">
          <Card className="border-white/10 bg-white/5">
            <CardContent className="p-5">
              <div className="text-sm font-semibold text-zinc-50">Контакты</div>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Input
                  value={name}
                  onChange={(e) => setName(e.currentTarget.value)}
                  placeholder="Имя"
                  className="h-11 rounded-2xl border-white/10 bg-black/40 text-zinc-50"
                />
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.currentTarget.value)}
                  placeholder="Телефон"
                  className="h-11 rounded-2xl border-white/10 bg-black/40 text-zinc-50"
                />
                <Input
                  value={email}
                  onChange={(e) => setEmail(e.currentTarget.value)}
                  placeholder="Email (опционально)"
                  className="h-11 rounded-2xl border-white/10 bg-black/40 text-zinc-50"
                />
                <Input
                  value={address}
                  onChange={(e) => setAddress(e.currentTarget.value)}
                  placeholder="Адрес (опционально)"
                  className="h-11 rounded-2xl border-white/10 bg-black/40 text-zinc-50"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/5">
            <CardContent className="p-5">
              <div className="text-sm font-semibold text-zinc-50">Оплата</div>
              <div className="mt-3">
                <Select value={method} onValueChange={(v) => setMethod(v as PaymentMethod)}>
                  <SelectTrigger className="h-11 w-full rounded-2xl border-white/10 bg-black/40 text-zinc-50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-white/10 bg-black/95">
                    <SelectItem value="sberbank">Сбербанк (SberPay / эквайринг)</SelectItem>
                    <SelectItem value="mts-bank">МТС-Банк (интернет-эквайринг)</SelectItem>
                    <SelectItem value="evotor">Эвотор (онлайн-касса + приём платежей)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-zinc-200/75">
                Сейчас это демо-режим: мы создаём “платёж” на сервере и перекидываем на
                страницу успеха/ошибки. Реальные интеграции подключим позже через
                `payment.ts` и webhooks.
              </div>
            </CardContent>
          </Card>
        </div>

        <aside className="h-fit">
          <Card className="border-white/10 bg-white/5">
            <CardContent className="p-5">
              <div className="text-sm font-semibold text-zinc-50">Ваш заказ</div>
              <div className="mt-4 space-y-3">
                {cart.itemsDetailed.length === 0 ? (
                  <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-zinc-200/70">
                    Корзина пуста. Добавьте товары и возвращайтесь к оформлению.
                  </div>
                ) : (
                  cart.itemsDetailed.map(({ product, qty }) => (
                    <div key={product.id} className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-zinc-50">
                          {product.name}
                        </div>
                        <div className="mt-1 text-xs text-zinc-200/70">
                          {qty} × {formatRub(product.priceRub)}
                        </div>
                      </div>
                      <div className="text-sm font-semibold text-zinc-50">
                        {formatRub(product.priceRub * qty)}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <Separator className="my-4 bg-white/10" />

              <div className="flex items-center justify-between text-sm">
                <div className="text-zinc-200/70">Итого</div>
                <div className="font-semibold text-zinc-50">{formatRub(cart.totalRub)}</div>
              </div>

              <Button
                className="mt-4 h-11 w-full rounded-2xl bg-yellow-400 font-semibold text-black hover:bg-yellow-300"
                disabled={!canSubmit || submitting}
                onClick={onPay}
              >
                {submitting ? "Создаём платёж…" : "Перейти к оплате"}
              </Button>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

