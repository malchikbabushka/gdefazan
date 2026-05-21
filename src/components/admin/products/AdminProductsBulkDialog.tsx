"use client";

import { useState } from "react";
import type { AdminProductCategory } from "@/lib/admin-types";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  selectedCount: number;
  onApply: (ops: {
    setPrice?: number;
    adjustPercent?: number;
    setStockQty?: number;
    category?: AdminProductCategory;
    inStock?: boolean;
    published?: boolean;
  }) => Promise<void>;
};

export function AdminProductsBulkDialog({ open, onOpenChange, selectedCount, onApply }: Props) {
  const [usePrice, setUsePrice] = useState(false);
  const [priceRub, setPriceRub] = useState("");
  const [usePercent, setUsePercent] = useState(false);
  const [percent, setPercent] = useState("");
  const [useStock, setUseStock] = useState(false);
  const [stockQty, setStockQty] = useState("");
  const [useCategory, setUseCategory] = useState(false);
  const [category, setCategory] = useState<AdminProductCategory>("thermal-scope");
  const [useInStock, setUseInStock] = useState(false);
  const [inStock, setInStock] = useState(true);
  const [usePublished, setUsePublished] = useState(false);
  const [published, setPublished] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleApply() {
    setError(null);
    setLoading(true);
    try {
      const ops: Parameters<Props["onApply"]>[0] = {};
      if (usePrice && priceRub.trim()) {
        const n = Number(priceRub);
        if (!Number.isFinite(n) || n < 0) throw new Error("Некорректная цена");
        ops.setPrice = Math.floor(n);
      }
      if (usePercent && percent.trim()) {
        const n = Number(percent);
        if (!Number.isFinite(n)) throw new Error("Некорректный процент");
        ops.adjustPercent = n;
      }
      if (useStock && stockQty.trim()) {
        const n = Number(stockQty);
        if (!Number.isFinite(n) || n < 0) throw new Error("Некорректный остаток");
        ops.setStockQty = Math.floor(n);
      }
      if (useCategory) ops.category = category;
      if (useInStock) ops.inStock = inStock;
      if (usePublished) ops.published = published;

      if (
        ops.setPrice === undefined &&
        ops.adjustPercent === undefined &&
        ops.setStockQty === undefined &&
        ops.category === undefined &&
        ops.inStock === undefined &&
        ops.published === undefined
      ) {
        throw new Error("Отметьте хотя бы одно поле");
      }

      await onApply(ops);
      onOpenChange(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-white/10 bg-zinc-950 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-zinc-50">Массовая правка</DialogTitle>
          <p className="text-sm text-zinc-400">Выбрано товаров: {selectedCount}</p>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          {error ? (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-red-200">
              {error}
            </div>
          ) : null}

          <label className="flex items-start gap-3 rounded-lg border border-white/10 bg-black/40 p-3">
            <Checkbox
              checked={usePrice}
              onCheckedChange={() => setUsePrice(!usePrice)}
              className="mt-0.5"
            />
            <div className="flex-1 space-y-2">
              <div className="font-medium text-zinc-200">Цена (₽), заменить</div>
              <Input
                disabled={!usePrice}
                inputMode="numeric"
                value={priceRub}
                onChange={(e) => setPriceRub(e.target.value)}
                className="h-9 border-white/10 bg-black/50"
              />
            </div>
          </label>

          <label className="flex items-start gap-3 rounded-lg border border-white/10 bg-black/40 p-3">
            <Checkbox
              checked={usePercent}
              onCheckedChange={() => setUsePercent(!usePercent)}
              className="mt-0.5"
            />
            <div className="flex-1 space-y-2">
              <div className="font-medium text-zinc-200">Изменить цену на % (можно −10)</div>
              <Input
                disabled={!usePercent}
                inputMode="decimal"
                value={percent}
                onChange={(e) => setPercent(e.target.value)}
                className="h-9 border-white/10 bg-black/50"
              />
            </div>
          </label>

          <label className="flex items-start gap-3 rounded-lg border border-white/10 bg-black/40 p-3">
            <Checkbox
              checked={useStock}
              onCheckedChange={() => setUseStock(!useStock)}
              className="mt-0.5"
            />
            <div className="flex-1 space-y-2">
              <div className="font-medium text-zinc-200">Остаток (шт.)</div>
              <Input
                disabled={!useStock}
                inputMode="numeric"
                value={stockQty}
                onChange={(e) => setStockQty(e.target.value)}
                className="h-9 border-white/10 bg-black/50"
              />
            </div>
          </label>

          <label className="flex items-start gap-3 rounded-lg border border-white/10 bg-black/40 p-3">
            <Checkbox
              checked={useCategory}
              onCheckedChange={() => setUseCategory(!useCategory)}
              className="mt-0.5"
            />
            <div className="flex-1 space-y-2">
              <div className="font-medium text-zinc-200">Категория</div>
              <Select
                disabled={!useCategory}
                value={category}
                onValueChange={(v) => setCategory(v as AdminProductCategory)}
              >
                <SelectTrigger className="h-9 border-white/10 bg-black/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-white/10 bg-zinc-950">
                  <SelectItem value="thermal-scope">Теплоприцелы</SelectItem>
                  <SelectItem value="thermal-monocular">Монокуляры</SelectItem>
                  <SelectItem value="optical">Оптика</SelectItem>
                  <SelectItem value="collimator">Коллиматор</SelectItem>
                  <SelectItem value="other">Прочее</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </label>

          <label className="flex items-center gap-3 rounded-lg border border-white/10 bg-black/40 p-3">
            <Checkbox checked={useInStock} onCheckedChange={() => setUseInStock(!useInStock)} />
            <span className="text-zinc-200">В наличии</span>
            <Select
              disabled={!useInStock}
              value={inStock ? "yes" : "no"}
              onValueChange={(v) => setInStock(v === "yes")}
            >
              <SelectTrigger className="ml-auto h-8 w-32 border-white/10 bg-black/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-white/10 bg-zinc-950">
                <SelectItem value="yes">Да</SelectItem>
                <SelectItem value="no">Нет</SelectItem>
              </SelectContent>
            </Select>
          </label>

          <label className="flex items-center gap-3 rounded-lg border border-white/10 bg-black/40 p-3">
            <Checkbox
              checked={usePublished}
              onCheckedChange={() => setUsePublished(!usePublished)}
            />
            <span className="text-zinc-200">На сайте</span>
            <Select
              disabled={!usePublished}
              value={published ? "yes" : "no"}
              onValueChange={(v) => setPublished(v === "yes")}
            >
              <SelectTrigger className="ml-auto h-8 w-32 border-white/10 bg-black/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-white/10 bg-zinc-950">
                <SelectItem value="yes">Да</SelectItem>
                <SelectItem value="no">Нет</SelectItem>
              </SelectContent>
            </Select>
          </label>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            className="border-white/10"
            onClick={() => onOpenChange(false)}
          >
            Отмена
          </Button>
          <Button
            type="button"
            className="bg-yellow-400 text-black hover:bg-yellow-300"
            disabled={loading}
            onClick={() => void handleApply()}
          >
            Применить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
