"use client";

import {
  Plus,
  RefreshCw,
  Trash2,
  Package,
  Eye,
  EyeOff,
  Pencil,
  Search,
} from "lucide-react";
import { PRODUCTS } from "@/lib/products";
import type { Product } from "@/lib/catalog-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AdminProductCategory } from "@/lib/admin-types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useMemo, useState } from "react";

type StockF = "all" | "yes" | "no";
type PubF = "all" | "yes" | "no";

type Props = {
  search: string;
  onSearchChange: (v: string) => void;
  category: AdminProductCategory | "all";
  onCategoryChange: (v: AdminProductCategory | "all") => void;
  stockFilter: StockF;
  onStockFilterChange: (v: StockF) => void;
  publishedFilter: PubF;
  onPublishedFilterChange: (v: PubF) => void;
  brandFilter: string;
  onBrandFilterChange: (v: string) => void;
  brands: string[];
  priceMin: string;
  priceMax: string;
  onPriceMinChange: (v: string) => void;
  onPriceMaxChange: (v: string) => void;
  onResetFilters: () => void;
  loading: boolean;
  onRefresh: () => void;
  onAdd: () => void;
  selectedCount: number;
  onBulkDelete: () => void;
  onBulkInStock: (v: boolean) => void;
  onBulkPublished: (v: boolean) => void;
  onOpenBulkEdit: () => void;
};

export function AdminProductsToolbar({
  search,
  onSearchChange,
  category,
  onCategoryChange,
  stockFilter,
  onStockFilterChange,
  publishedFilter,
  onPublishedFilterChange,
  brandFilter,
  onBrandFilterChange,
  brands,
  priceMin,
  priceMax,
  onPriceMinChange,
  onPriceMaxChange,
  onResetFilters,
  loading,
  onRefresh,
  onAdd,
  selectedCount,
  onBulkDelete,
  onBulkInStock,
  onBulkPublished,
  onOpenBulkEdit,
}: Props) {
  const [pickOpen, setPickOpen] = useState(false);
  const [pickQuery, setPickQuery] = useState("");

  const catalogMatches = useMemo(() => {
    const q = pickQuery.trim().toLowerCase();
    const list = PRODUCTS;
    const out = q
      ? list.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.brand.toLowerCase().includes(q) ||
            p.id.toLowerCase().includes(q),
        )
      : list;
    return out.slice(0, 50);
  }, [pickQuery]);

  async function createOverlayForCatalogProduct(p: Product) {
    // Create an admin_products row linked to existing catalog item.
    const category: AdminProductCategory = p.type === "monocular" ? "thermal-monocular" : "thermal-scope";
    const r = await fetch("/api/admin/products", {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: p.name,
        brand: p.brand,
        priceRub: p.priceRub,
        inStock: p.inStock,
        category,
        linkedCatalogProductId: p.id,
        published: true,
      }),
    });
    if (!r.ok) {
      const j = (await r.json().catch(() => ({}))) as { error?: string };
      throw new Error(j.error ?? "Не удалось создать оверлей товара");
    }
  }

  return (
    <div className="space-y-3 border-b border-white/10 bg-black/30 pb-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div className="relative min-w-0 flex-1 max-w-xl">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <Input
            placeholder="Поиск: название, бренд, id, связь с каталогом…"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-10 rounded-xl border-white/10 bg-black/50 pl-10 text-sm text-zinc-50"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-10 rounded-xl border-white/10 bg-white/5 text-zinc-50"
            disabled={loading}
            onClick={onRefresh}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Обновить
          </Button>
          <Button
            type="button"
            size="sm"
            className="h-10 rounded-xl bg-yellow-400 font-semibold text-black hover:bg-yellow-300"
            disabled={loading}
            onClick={onAdd}
          >
            <Plus className="mr-2 h-4 w-4" />
            Добавить товар
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-10 rounded-xl border-white/10 bg-white/5 text-zinc-50"
            disabled={loading}
            onClick={() => setPickOpen(true)}
          >
            <Pencil className="mr-2 h-4 w-4" />
            Редактировать товар витрины…
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={category}
          onValueChange={(v) => onCategoryChange(v as AdminProductCategory | "all")}
        >
          <SelectTrigger className="h-9 w-[200px] rounded-lg border-white/10 bg-black/50 text-xs">
            <SelectValue placeholder="Категория" />
          </SelectTrigger>
          <SelectContent className="border-white/10 bg-zinc-950">
            <SelectItem value="all">Все категории</SelectItem>
            <SelectItem value="thermal-scope">Теплоприцелы</SelectItem>
            <SelectItem value="thermal-monocular">Монокуляры</SelectItem>
            <SelectItem value="optical">Оптика</SelectItem>
            <SelectItem value="collimator">Коллиматор</SelectItem>
            <SelectItem value="other">Прочее</SelectItem>
          </SelectContent>
        </Select>

        <Select value={stockFilter} onValueChange={(v) => onStockFilterChange(v as StockF)}>
          <SelectTrigger className="h-9 w-[150px] rounded-lg border-white/10 bg-black/50 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="border-white/10 bg-zinc-950">
            <SelectItem value="all">Наличие: все</SelectItem>
            <SelectItem value="yes">В наличии</SelectItem>
            <SelectItem value="no">Нет</SelectItem>
          </SelectContent>
        </Select>

        <Select value={publishedFilter} onValueChange={(v) => onPublishedFilterChange(v as PubF)}>
          <SelectTrigger className="h-9 w-[170px] rounded-lg border-white/10 bg-black/50 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="border-white/10 bg-zinc-950">
            <SelectItem value="all">Сайт: все</SelectItem>
            <SelectItem value="yes">Опубликован</SelectItem>
            <SelectItem value="no">Скрыт</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={brandFilter}
          onValueChange={(v) => onBrandFilterChange(v ?? "all")}
        >
          <SelectTrigger className="h-9 w-[180px] rounded-lg border-white/10 bg-black/50 text-xs">
            <SelectValue placeholder="Бренд" />
          </SelectTrigger>
          <SelectContent className="border-white/10 bg-zinc-950">
            <SelectItem value="all">Все бренды</SelectItem>
            {brands.map((b) => (
              <SelectItem key={b} value={b}>
                {b}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-1">
          <Input
            placeholder="Цена от"
            inputMode="numeric"
            value={priceMin}
            onChange={(e) => onPriceMinChange(e.target.value)}
            className="h-9 w-24 rounded-lg border-white/10 bg-black/50 text-xs"
          />
          <span className="text-zinc-500">—</span>
          <Input
            placeholder="до"
            inputMode="numeric"
            value={priceMax}
            onChange={(e) => onPriceMaxChange(e.target.value)}
            className="h-9 w-24 rounded-lg border-white/10 bg-black/50 text-xs"
          />
        </div>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-9 text-xs text-zinc-400 hover:text-zinc-200"
          onClick={onResetFilters}
        >
          Сбросить фильтры
        </Button>
      </div>

      {selectedCount > 0 ? (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-yellow-400/20 bg-yellow-400/10 px-3 py-2">
          <Package className="h-4 w-4 text-yellow-200/90" />
          <span className="text-sm font-medium text-yellow-100/90">
            Выбрано: {selectedCount}
          </span>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-8 border-white/15 bg-black/30 text-xs"
            onClick={() => onBulkInStock(true)}
          >
            В наличии
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-8 border-white/15 bg-black/30 text-xs"
            onClick={() => onBulkInStock(false)}
          >
            Нет в наличии
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-8 border-white/15 bg-black/30 text-xs"
            onClick={() => onBulkPublished(true)}
          >
            <Eye className="mr-1 h-3.5 w-3.5" />
            На сайте
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-8 border-white/15 bg-black/30 text-xs"
            onClick={() => onBulkPublished(false)}
          >
            <EyeOff className="mr-1 h-3.5 w-3.5" />
            Скрыть
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-8 border-white/15 bg-black/30 text-xs text-zinc-100"
            onClick={onOpenBulkEdit}
          >
            <Pencil className="mr-1 h-3.5 w-3.5" />
            Массовая правка…
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-8 border-red-500/30 bg-red-500/10 text-xs text-red-200 hover:bg-red-500/20"
            onClick={onBulkDelete}
          >
            <Trash2 className="mr-1 h-3.5 w-3.5" />
            Удалить
          </Button>
        </div>
      ) : null}

      <Dialog open={pickOpen} onOpenChange={setPickOpen}>
        <DialogContent className="max-w-3xl border-white/10 bg-black/95 text-zinc-50">
          <DialogHeader>
            <DialogTitle>Товар витрины → создать оверлей в админке</DialogTitle>
          </DialogHeader>
          <div className="text-sm text-zinc-300/80">
            Старые товары витрины живут в каталоге. Чтобы их редактировать в админке, нужно создать запись-оверлей и
            связать её через <span className="font-mono">linkedCatalogProductId</span>.
          </div>
          <div className="mt-3">
            <Input
              placeholder="Поиск по каталогу: название, бренд, id…"
              value={pickQuery}
              onChange={(e) => setPickQuery(e.target.value)}
              className="h-10 rounded-xl border-white/10 bg-black/50 text-sm text-zinc-50"
            />
          </div>
          <div className="mt-3 max-h-[420px] overflow-auto rounded-xl border border-white/10">
            {catalogMatches.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between gap-3 border-b border-white/5 px-3 py-2 last:border-b-0"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">{p.brand} {p.name}</div>
                  <div className="truncate font-mono text-[11px] text-zinc-500">{p.id}</div>
                </div>
                <Button
                  type="button"
                  size="sm"
                  className="h-9 shrink-0 rounded-xl bg-yellow-400 font-semibold text-black hover:bg-yellow-300"
                  onClick={async () => {
                    try {
                      await createOverlayForCatalogProduct(p);
                      setPickOpen(false);
                      setPickQuery("");
                      onRefresh();
                    } catch (e) {
                      alert(e instanceof Error ? e.message : "Ошибка");
                    }
                  }}
                >
                  Создать оверлей
                </Button>
              </div>
            ))}
            {catalogMatches.length === 0 ? (
              <div className="px-3 py-10 text-center text-sm text-zinc-500">Нет совпадений</div>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
