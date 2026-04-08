"use client";

import { useMemo, useState } from "react";
import { ProductGrid } from "@/components/home/ProductGrid";
import type { CatalogFilters, Matrix, SortKey } from "@/lib/catalog-types";
import { useProducts } from "@/lib/products-store";
import {
  parseOptionalInt,
  productMatchesFilters,
  sortProducts,
} from "@/lib/catalog-logic";
import { Filters } from "@/components/home/Filters";

const ALL_MATRICES: Matrix[] = ["384×288", "640×512", "1024×768", "1280×1024"];
const ALL_LENSES: Array<19 | 25 | 35 | 50> = [19, 25, 35, 50];

const DEFAULT_FILTERS: CatalogFilters = {
  query: "",
  priceMin: undefined,
  priceMax: undefined,
  deviceTypes: new Set(),
  matrices: new Set<Matrix>(),
  lenses: new Set<19 | 25 | 35 | 50>(),
  magnificationBand: "any",
  rangefinderOnly: false,
  inStockOnly: true,
};

export function ThermalMonocularsClient() {
  const { products } = useProducts();
  const [sort, setSort] = useState<SortKey>("popular");
  const [filters, setFilters] = useState<CatalogFilters>(DEFAULT_FILTERS);
  const [priceMinText, setPriceMinText] = useState("");
  const [priceMaxText, setPriceMaxText] = useState("");

  const filtered = useMemo(() => {
    const base = products.filter((p) => p.type === "monocular");
    const f: CatalogFilters = {
      ...filters,
      priceMin: parseOptionalInt(priceMinText),
      priceMax: parseOptionalInt(priceMaxText),
    };
    return sortProducts(base.filter((p) => productMatchesFilters(p, f)), sort);
  }, [filters, priceMinText, priceMaxText, products, sort]);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">
          Тепловизионные монокуляры
        </h1>
        <p className="mt-2 text-sm text-zinc-200/75">
          Демо-раздел. Фильтры и сортировка работают по тестовым товарам.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
        <Filters
          allMatrices={ALL_MATRICES}
          allLenses={ALL_LENSES}
          sort={sort}
          onSortChange={setSort}
          filters={filters}
          onFiltersChange={setFilters}
          priceMinText={priceMinText}
          priceMaxText={priceMaxText}
          onPriceMinTextChange={setPriceMinText}
          onPriceMaxTextChange={setPriceMaxText}
          onReset={() => {
            setFilters(DEFAULT_FILTERS);
            setSort("popular");
            setPriceMinText("");
            setPriceMaxText("");
          }}
          resultsCount={filtered.length}
        />
        <main className="min-w-0">
          <ProductGrid products={filtered} />
        </main>
      </div>
    </div>
  );
}

