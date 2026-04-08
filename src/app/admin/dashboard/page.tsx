"use client";

import { useEffect, useState } from "react";
import { BarChart3, Package, ShoppingCart, Warehouse } from "lucide-react";
import { formatRub } from "@/lib/catalog-logic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Stats = {
  revenueRub: number;
  ordersCount: number;
  inStockCount: number;
  totalProducts: number;
};

function StatCard({
  title,
  value,
  icon,
  hint,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  hint?: string;
}) {
  return (
    <Card className="rounded-2xl border-white/10 bg-black/30">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-zinc-300/60">
              {title}
            </div>
            <div className="mt-2 text-2xl font-semibold tracking-tight text-zinc-50">
              {value}
            </div>
            {hint ? <div className="mt-2 text-xs text-zinc-200/65">{hint}</div> : null}
          </div>
          <div className="rounded-2xl border border-yellow-400/15 bg-yellow-400/8 p-3 text-yellow-100/90">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        setStats(data as Stats);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Ошибка загрузки"));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Card className="border-white/10 bg-white/5">
      <CardHeader className="space-y-2">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-2xl font-semibold tracking-tight text-zinc-50">
              Дашборд
            </CardTitle>
            <p className="mt-2 text-sm text-zinc-200/75">
              Демонстрационная статистика (за последние 30 дней) и данные по товарам.
            </p>
          </div>
          <Badge className="hidden border border-white/10 bg-black/30 text-zinc-200/70 hover:bg-black/30 sm:inline-flex">
            <BarChart3 className="mr-2 h-4 w-4 text-yellow-100/80" />
            API: <span className="font-mono">/api/admin/*</span>
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-6 pt-0">

      {error ? (
        <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200/90">
          {error}
        </div>
      ) : null}

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Выручка (30 дней)"
          value={stats ? formatRub(stats.revenueRub) : "—"}
          icon={<ShoppingCart className="h-5 w-5" />}
          hint="На базе демо-заказов из JSON"
        />
        <StatCard
          title="Заказы (30 дней)"
          value={stats ? String(stats.ordersCount) : "—"}
          icon={<Package className="h-5 w-5" />}
        />
        <StatCard
          title="Товары в наличии"
          value={stats ? String(stats.inStockCount) : "—"}
          icon={<Warehouse className="h-5 w-5" />}
        />
        <StatCard
          title="Всего товаров"
          value={stats ? String(stats.totalProducts) : "—"}
          icon={<Package className="h-5 w-5" />}
        />
      </div>
      </CardContent>
    </Card>
  );
}

