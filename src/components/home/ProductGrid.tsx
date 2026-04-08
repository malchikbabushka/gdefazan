import type { Product } from "@/lib/catalog-types";
import { ProductCard } from "./ProductCard";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutGrid, List } from "lucide-react";
import { useState } from "react";

type Props = {
  products: Product[];
};

export function ProductGrid({ products }: Props) {
  const [view, setView] = useState<"grid" | "list">("grid");

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-zinc-50">Товары</h2>
          <p className="mt-1 text-xs text-zinc-200/70">
            Показано: <span className="tabular-nums">{products.length}</span>
          </p>
        </div>

        <Tabs value={view} onValueChange={(v) => setView(v as any)}>
          <TabsList className="rounded-xl border border-white/10 bg-white/5">
            <TabsTrigger value="grid" className="gap-2">
              <LayoutGrid className="h-4 w-4" />
              Сетка
            </TabsTrigger>
            <TabsTrigger value="list" className="gap-2">
              <List className="h-4 w-4" />
              Список
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {view === "grid" ? (
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {products.map((p) => (
            <div key={p.id} className="max-w-4xl">
              <ProductCard product={p} />
            </div>
          ))}
        </div>
      )}

      {products.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-zinc-200/80">
          По текущим фильтрам ничего не найдено. Попробуйте снять ограничения по
          матрице/линзе или расширить диапазон цены.
        </div>
      ) : null}
    </>
  );
}

