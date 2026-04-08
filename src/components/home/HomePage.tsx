"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { CatalogFilters, Matrix, ProductType, SortKey } from "@/lib/catalog-types";
import { useAppProducts } from "@/components/providers/AppProviders";
import {
  parseOptionalInt,
  productMatchesFilters,
  sortProducts,
} from "@/lib/catalog-logic";
import { Hero } from "./Hero";
import { Filters } from "./Filters";
import { ProductGrid } from "./ProductGrid";

const ALL_MATRICES: Matrix[] = ["384×288", "640×512", "1024×768", "1280×1024"];
const ALL_LENSES: Array<19 | 25 | 35 | 50> = [19, 25, 35, 50];

const DEFAULT_FILTERS: CatalogFilters = {
  query: "",
  priceMin: undefined,
  priceMax: undefined,
  deviceTypes: new Set<ProductType>(),
  matrices: new Set<Matrix>(),
  lenses: new Set<19 | 25 | 35 | 50>(),
  magnificationBand: "any",
  rangefinderOnly: false,
  inStockOnly: true,
};

export function HomePage() {
  const { products } = useAppProducts();
  const searchParams = useSearchParams();
  const [sort, setSort] = useState<SortKey>("popular");
  const [filters, setFilters] = useState<CatalogFilters>(DEFAULT_FILTERS);
  const [priceMinText, setPriceMinText] = useState("");
  const [priceMaxText, setPriceMaxText] = useState("");

  useEffect(() => {
    const q = (searchParams.get("q") ?? "").trim();
    if (q && q !== filters.query) {
      setFilters((f) => ({ ...f, query: q }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const filtered = useMemo(() => {
    const f: CatalogFilters = {
      ...filters,
      priceMin: parseOptionalInt(priceMinText),
      priceMax: parseOptionalInt(priceMaxText),
    };
    return sortProducts(products.filter((p) => productMatchesFilters(p, f)), sort);
  }, [filters, priceMinText, priceMaxText, products, sort]);

  return (
    <div className="min-h-full">
      <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <Hero
          onOpenFilters={() =>
            document
              .getElementById("filters")
              ?.scrollIntoView({ behavior: "smooth", block: "start" })
          }
          onApplyQuickFilter={(patch) => {
            setFilters((f) => ({ ...f, ...patch }));
            document
              .getElementById("catalog")
              ?.scrollIntoView({ behavior: "smooth", block: "start" });
          }}
        />

        <div
          id="catalog"
          className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]"
        >
          <Filters
            id="filters"
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
    </div>
  );
}

