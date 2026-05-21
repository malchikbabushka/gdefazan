"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { formatRub } from "@/lib/catalog-logic";
import type { AdminOrder } from "@/lib/admin-types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function AdminOrderDetailPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const [order, setOrder] = useState<AdminOrder | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    fetch(`/api/admin/orders/${encodeURIComponent(id)}`, { credentials: "include" })
      .then(async (r) => {
        if (r.status === 401) throw new Error("Требуется вход");
        if (r.status === 404) throw new Error("Заказ не найден");
        if (!r.ok) throw new Error("Ошибка загрузки");
        return r.json() as Promise<{ order: AdminOrder }>;
      })
      .then((data) => {
        if (!cancelled) setOrder(data.order);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Ошибка");
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <Card className="border-white/10 bg-white/5">
      <CardHeader className="space-y-4">
        <Link
          href="/admin/orders"
          className={cn(
            buttonVariants({ variant: "ghost", size: "lg" }),
            "h-9 w-fit gap-2 px-0 text-zinc-300 hover:bg-transparent hover:text-zinc-50",
          )}
        >
          <ArrowLeft className="h-4 w-4" />
          К списку
        </Link>
        <CardTitle className="text-2xl font-semibold tracking-tight text-zinc-50">
          Заказ {id || "…"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 p-6 pt-0">
        {error ? (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200/90">
            {error}
          </div>
        ) : null}

        {order ? (
          <>
            <div className="grid gap-3 text-sm text-zinc-200/85 sm:grid-cols-2">
              <div>
                <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">Дата</div>
                <div className="mt-1">{new Date(order.createdAt).toLocaleString("ru-RU")}</div>
              </div>
              <div>
                <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">Сумма</div>
                <div className="mt-1 text-lg font-semibold text-yellow-100/90">
                  {formatRub(order.totalRub)}
                </div>
              </div>
              <div>
                <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">Имя</div>
                <div className="mt-1">{order.customerName ?? "—"}</div>
              </div>
              <div>
                <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">Телефон</div>
                <div className="mt-1">{order.customerPhone ?? "—"}</div>
              </div>
              <div>
                <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">Email</div>
                <div className="mt-1">{order.customerEmail ?? "—"}</div>
              </div>
              <div className="sm:col-span-2">
                <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">Заметки</div>
                <div className="mt-1 whitespace-pre-wrap">{order.notes ?? "—"}</div>
              </div>
            </div>

            <Separator className="bg-white/10" />

            <div>
              <h2 className="text-sm font-semibold text-zinc-50">Позиции</h2>
              <div className="mt-3 overflow-hidden rounded-2xl border border-white/10 bg-black/30">
                <Table>
                  <TableHeader className="border-b border-white/10 bg-black/40 text-xs uppercase tracking-wide text-zinc-300/60">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="px-4">Товар</TableHead>
                      <TableHead className="px-4">Артикул</TableHead>
                      <TableHead className="px-4 text-right">Цена</TableHead>
                      <TableHead className="px-4 text-right">Кол-во</TableHead>
                      <TableHead className="px-4 text-right">Итого</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(order.items ?? []).map((it, idx) => (
                      <TableRow key={`${it.productName}-${idx}`} className="hover:bg-white/5">
                        <TableCell className="px-4 py-3 text-sm text-zinc-100">{it.productName}</TableCell>
                        <TableCell className="px-4 py-3 font-mono text-xs text-zinc-400">
                          {it.productId ?? "—"}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-right text-sm text-zinc-200/80">
                          {formatRub(it.priceRub)}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-right text-sm text-zinc-200/80">
                          {it.quantity}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-right text-sm font-medium text-zinc-50">
                          {formatRub(it.priceRub * it.quantity)}
                        </TableCell>
                      </TableRow>
                    ))}
                    {!order.items?.length ? (
                      <TableRow className="hover:bg-transparent">
                        <TableCell
                          colSpan={5}
                          className="px-4 py-8 text-center text-sm text-zinc-200/70"
                        >
                          Позиции не сохранены (старый формат заказа).
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </TableBody>
                </Table>
              </div>
            </div>
          </>
        ) : !error ? (
          <div className="text-sm text-zinc-400">Загрузка…</div>
        ) : null}
      </CardContent>
    </Card>
  );
}
