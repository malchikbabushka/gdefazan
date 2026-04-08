import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function CheckoutFailPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <Card className="border-white/10 bg-white/5">
        <CardContent className="p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl border border-white/10 bg-black/30 p-3 text-zinc-200/80">
              <AlertTriangle className="h-6 w-6 text-yellow-100/90" />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">
                Ошибка оплаты
              </h1>
              <p className="mt-2 text-sm text-zinc-200/70">
                Демо-режим: платёж не был подтверждён. Попробуйте ещё раз или выберите
                другой способ оплаты.
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                <Link
                  href="/checkout"
                  className={cn(
                    buttonVariants({ size: "lg" }),
                    "rounded-2xl bg-yellow-400 font-semibold text-black hover:bg-yellow-300",
                  )}
                >
                  Вернуться к оплате
                </Link>
                <Link
                  href="/cart"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "lg" }),
                    "rounded-2xl border-white/10 bg-white/5 text-zinc-50 hover:bg-white/10",
                  )}
                >
                  В корзину
                </Link>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

