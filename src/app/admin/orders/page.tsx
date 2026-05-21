"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatRub } from "@/lib/catalog-logic";
import type { AdminOrder } from "@/lib/admin-types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/orders", { credentials: "include" })
      .then(async (r) => {
        if (r.status === 401) throw new Error("Требуется вход");
        if (!r.ok) throw new Error("Не удалось загрузить заказы");
        return r.json() as Promise<{ orders: AdminOrder[] }>;
      })
      .then((data) => {
        if (!cancelled) setOrders(Array.isArray(data.orders) ? data.orders : []);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Ошибка");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Card className="border-white/10 bg-white/5">
      <CardHeader>
        <CardTitle className="text-2xl font-semibold tracking-tight text-zinc-50">Заказы</CardTitle>
        <p className="text-sm text-zinc-200/75">
          Заказы создаются при оформлении (демо-платёж). Состав позиций доступен в карточке.
        </p>
      </CardHeader>
      <CardContent className="p-6 pt-0">
        {error ? (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200/90">
            {error}
          </div>
        ) : null}

        <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-black/30">
          <Table>
            <TableHeader className="border-b border-white/10 bg-black/40 text-xs uppercase tracking-wide text-zinc-300/60">
              <TableRow className="hover:bg-transparent">
                <TableHead className="px-4">Номер</TableHead>
                <TableHead className="px-4">Дата</TableHead>
                <TableHead className="px-4">Статус</TableHead>
                <TableHead className="px-4">Клиент</TableHead>
                <TableHead className="px-4 text-right">Сумма</TableHead>
                <TableHead className="px-4" />
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-white/10">
              {orders.map((o) => (
                <TableRow key={o.id} className="hover:bg-white/5">
                  <TableCell className="px-4 py-3 font-mono text-xs text-zinc-300">{o.id}</TableCell>
                  <TableCell className="px-4 py-3 text-sm text-zinc-200/80">
                    {new Date(o.createdAt).toLocaleString("ru-RU")}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <Badge className="border border-white/10 bg-white/5 text-zinc-200/90">
                      {o.status ?? "new"}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate px-4 py-3 text-sm text-zinc-200/80">
                    {o.customerName || o.customerPhone || o.customerEmail || "—"}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-right font-semibold text-yellow-100/90">
                    {formatRub(o.totalRub)}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/orders/${encodeURIComponent(o.id)}`}
                      className={cn(
                        buttonVariants({ variant: "outline", size: "sm" }),
                        "inline-flex rounded-xl border-white/10 bg-white/5 text-zinc-50 hover:bg-white/10",
                      )}
                    >
                      Открыть
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
              {orders.length === 0 && !error ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={6} className="px-4 py-10 text-center text-sm text-zinc-200/70">
                    Заказов пока нет.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
