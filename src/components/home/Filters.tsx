"use client";

import type { CatalogFilters, Matrix, SortKey } from "@/lib/catalog-types";
import { formatRub } from "@/lib/catalog-logic";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Props = {
  id?: string;
  allMatrices: Matrix[];
  allLenses: Array<19 | 25 | 35 | 50>;
  sort: SortKey;
  onSortChange: (v: SortKey) => void;
  filters: CatalogFilters;
  onFiltersChange: (next: CatalogFilters) => void;
  priceMinText: string;
  priceMaxText: string;
  onPriceMinTextChange: (v: string) => void;
  onPriceMaxTextChange: (v: string) => void;
  onReset: () => void;
  resultsCount: number;
};

function toggleInSet<T>(set: Set<T>, value: T) {
  const next = new Set(set);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
}

export function Filters({
  id,
  allMatrices,
  allLenses,
  sort,
  onSortChange,
  filters,
  onFiltersChange,
  priceMinText,
  priceMaxText,
  onPriceMinTextChange,
  onPriceMaxTextChange,
  onReset,
  resultsCount,
}: Props) {
  return (
    <aside id={id} className="h-fit">
      <Card className="rounded-2xl border-white/10 bg-white/5">
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-zinc-50">Фильтры</h2>
              <div className="mt-1 text-xs text-zinc-300/70">
                Найдено: <span className="tabular-nums">{resultsCount}</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="h-9 rounded-xl border-white/10 bg-white/5 px-3 text-xs font-semibold text-zinc-50 hover:bg-white/10"
              onClick={onReset}
            >
              Сбросить
            </Button>
          </div>

          <Separator className="my-4 bg-white/10" />

          <div className="space-y-4">
            <div className="space-y-2">
              <div className="text-xs font-medium text-zinc-200/90">Тип прибора</div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "scope" as const, label: "Прицел" },
                  { id: "monocular" as const, label: "Монокуляр" },
                ].map((t) => (
                  <label
                    key={t.id}
                    className="flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs text-zinc-200/90 hover:bg-white/5"
                  >
                    <Checkbox
                      checked={filters.deviceTypes.has(t.id)}
                      onCheckedChange={() =>
                        onFiltersChange({
                          ...filters,
                          deviceTypes: toggleInSet(filters.deviceTypes, t.id),
                        })
                      }
                      className="data-[state=checked]:border-yellow-400 data-[state=checked]:bg-yellow-400 data-[state=checked]:text-black"
                    />
                    {t.label}
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-200/90">Поиск</label>
              <Input
                className="h-10 rounded-xl border-white/10 bg-black/40 text-zinc-50 placeholder:text-zinc-400 focus-visible:ring-yellow-400/30"
                placeholder="бренд или модель…"
                value={filters.query}
                onChange={(e) =>
                  onFiltersChange({ ...filters, query: e.currentTarget.value })
                }
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-baseline justify-between gap-3">
                <label className="text-xs font-medium text-zinc-200/90">Цена</label>
                <div className="text-xs tabular-nums text-zinc-200/70">
                  {formatRub(59000)} – {formatRub(499000)}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  className="h-10 rounded-xl border-white/10 bg-black/40 text-zinc-50 placeholder:text-zinc-400 focus-visible:ring-yellow-400/30"
                  placeholder="от"
                  inputMode="numeric"
                  value={priceMinText}
                  onChange={(e) => onPriceMinTextChange(e.currentTarget.value)}
                />
                <Input
                  className="h-10 rounded-xl border-white/10 bg-black/40 text-zinc-50 placeholder:text-zinc-400 focus-visible:ring-yellow-400/30"
                  placeholder="до"
                  inputMode="numeric"
                  value={priceMaxText}
                  onChange={(e) => onPriceMaxTextChange(e.currentTarget.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-medium text-zinc-200/90">Матрица</div>
              <div className="grid grid-cols-2 gap-2">
                {allMatrices.map((v) => (
                  <label
                    key={v}
                    className="flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs text-zinc-200/90 hover:bg-white/5"
                  >
                    <Checkbox
                      checked={filters.matrices.has(v)}
                      onCheckedChange={() =>
                        onFiltersChange({
                          ...filters,
                          matrices: toggleInSet(filters.matrices, v),
                        })
                      }
                      className="data-[state=checked]:border-yellow-400 data-[state=checked]:bg-yellow-400 data-[state=checked]:text-black"
                    />
                    {v}
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-medium text-zinc-200/90">Линза</div>
              <div className="grid grid-cols-2 gap-2">
                {allLenses.map((mm) => (
                  <label
                    key={mm}
                    className="flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs text-zinc-200/90 hover:bg-white/5"
                  >
                    <Checkbox
                      checked={filters.lenses.has(mm)}
                      onCheckedChange={() =>
                        onFiltersChange({
                          ...filters,
                          lenses: toggleInSet(filters.lenses, mm),
                        })
                      }
                      className="data-[state=checked]:border-yellow-400 data-[state=checked]:bg-yellow-400 data-[state=checked]:text-black"
                    />
                    {mm} мм
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-medium text-zinc-200/90">Кратность</div>
              <Select
                value={filters.magnificationBand}
                onValueChange={(value) =>
                  onFiltersChange({
                    ...filters,
                    magnificationBand: value as Props["filters"]["magnificationBand"],
                  })
                }
              >
                <SelectTrigger className="h-10 w-full rounded-xl border-white/10 bg-black/40 text-zinc-50">
                  <SelectValue placeholder="Любая" />
                </SelectTrigger>
                <SelectContent className="border-white/10 bg-black/95">
                  <SelectItem value="any">Любая</SelectItem>
                  <SelectItem value="1-4">1× – 4×</SelectItem>
                  <SelectItem value="4-8">4× – 8×</SelectItem>
                  <SelectItem value="8+">8×+</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-medium text-zinc-200/90">Опции</div>

              <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs text-zinc-200/90 hover:bg-white/5">
                <span>С дальномером</span>
                <Checkbox
                  checked={filters.rangefinderOnly}
                  onCheckedChange={() =>
                    onFiltersChange({
                      ...filters,
                      rangefinderOnly: !filters.rangefinderOnly,
                    })
                  }
                  className="data-[state=checked]:border-yellow-400 data-[state=checked]:bg-yellow-400 data-[state=checked]:text-black"
                />
              </label>

              <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs text-zinc-200/90 hover:bg-white/5">
                <span>В наличии</span>
                <Checkbox
                  checked={filters.inStockOnly}
                  onCheckedChange={() =>
                    onFiltersChange({ ...filters, inStockOnly: !filters.inStockOnly })
                  }
                  className="data-[state=checked]:border-yellow-400 data-[state=checked]:bg-yellow-400 data-[state=checked]:text-black"
                />
              </label>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-medium text-zinc-200/90">Сортировка</div>
              <Select value={sort} onValueChange={(v) => onSortChange(v as SortKey)}>
                <SelectTrigger className="h-10 w-full rounded-xl border-white/10 bg-black/40 text-zinc-50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-white/10 bg-black/95">
                  <SelectItem value="popular">Сначала популярные</SelectItem>
                  <SelectItem value="priceAsc">Сначала дешевле</SelectItem>
                  <SelectItem value="priceDesc">Сначала дороже</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
    </aside>
  );
}

