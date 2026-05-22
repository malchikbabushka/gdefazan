"use client";

import { useEffect, useMemo, useState } from "react";
import { ProductCard } from "@/components/home/ProductCard";
import { useAppProducts } from "@/components/providers/AppProviders";
import type { SiteConfig } from "@/lib/site-config";
import { DEFAULT_SITE_CONFIG } from "@/lib/site-config";

export function LeadersSection() {
  const { products } = useAppProducts();
  const [cfg, setCfg] = useState<SiteConfig>(DEFAULT_SITE_CONFIG);

  useEffect(() => {
    // Load leaders order from server config; keep it fresh enough for admin updates.
    fetch(`/api/site-config?ts=${Date.now()}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.config) setCfg(data.config as SiteConfig);
      })
      .catch(() => {});
  }, []);

  const leaders = useMemo(() => {
    const ids = Array.isArray(cfg.homeLeadersProductIds) ? cfg.homeLeadersProductIds : [];
    if (ids.length) {
      const byId = new Map(products.map((p) => [p.id, p] as const));
      const picked = ids
        .map((id) => byId.get(id))
        .filter((p): p is NonNullable<typeof p> => Boolean(p))
        .slice(0, 6);
      if (picked.length) return picked;
    }

    const items = [...products];
    items.sort((a, b) => b.popularity - a.popularity);

    const sytong = items.find(
      (p) =>
        p.brand.toLowerCase().includes("sytong") &&
        p.name.toLowerCase().replace(/\s+/g, "").includes("mm06-50"),
    );

    const top = items.slice(0, 6).filter((p) => p.id !== sytong?.id);
    return sytong ? [sytong, ...top].slice(0, 6) : top;
  }, [cfg.homeLeadersProductIds, products]);

  return (
    <section className="mt-10">
      <div className="flex items-center justify-center">
        <div className="w-full max-w-xl text-center">
          <div className="mx-auto h-1 w-24 rounded-full bg-yellow-400/80" />
          <h2 className="mt-4 text-lg font-semibold tracking-wide text-zinc-50">
            ЛИДЕРЫ ПРОДАЖ
          </h2>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {leaders.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}

