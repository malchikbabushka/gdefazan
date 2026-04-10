"use client";

import { useMemo } from "react";
import { useAppProducts } from "@/components/providers/AppProviders";
import { ProductCard } from "@/components/home/ProductCard";
import type { Product } from "@/lib/catalog-types";

export function RelatedProducts({
  currentId,
  type,
}: {
  currentId: string;
  type: Product["type"];
}) {
  const { products } = useAppProducts();

  const related = useMemo(() => {
    const sameType = products.filter(
      (p) => p.type === type && p.id !== currentId,
    );
    sameType.sort((a, b) => b.popularity - a.popularity);
    return sameType.slice(0, 4);
  }, [products, currentId, type]);

  if (related.length === 0) return null;

  return (
    <section className="mt-12">
      <h2 className="text-lg font-semibold text-zinc-50">Похожие товары</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {related.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}
