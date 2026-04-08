import type { CatalogFilters, Product, SortKey } from "./catalog-types";

export function formatRub(value: number) {
  const s = new Intl.NumberFormat("ru-RU").format(value);
  return `${s} ₽`;
}

export function clampNumber(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export function parseOptionalInt(input: string): number | undefined {
  const normalized = input.replace(/\s+/g, "").replace(/[^\d]/g, "");
  if (!normalized) return undefined;
  const v = Number.parseInt(normalized, 10);
  return Number.isFinite(v) ? v : undefined;
}

export function productMatchesFilters(p: Product, f: CatalogFilters) {
  // Defensive: filters can be partially constructed from UI / URL / storage.
  // Treat missing Sets as "no filter".
  const deviceTypes = f.deviceTypes ?? new Set();
  const matrices = f.matrices ?? new Set();
  const lenses = f.lenses ?? new Set();

  if (f.inStockOnly && !p.inStock) return false;
  if (f.rangefinderOnly && !p.hasRangefinder) return false;
  if (deviceTypes.size > 0 && !deviceTypes.has(p.type)) return false;

  if (f.query.trim()) {
    const q = f.query.trim().toLowerCase();
    const hay = `${p.brand} ${p.name}`.toLowerCase();
    if (!hay.includes(q)) return false;
  }

  if (typeof f.priceMin === "number" && p.priceRub < f.priceMin) return false;
  if (typeof f.priceMax === "number" && p.priceRub > f.priceMax) return false;

  if (matrices.size > 0 && !matrices.has(p.matrix)) return false;
  if (lenses.size > 0 && !lenses.has(p.lensMm)) return false;

  if (f.magnificationBand !== "any") {
    const min = p.magnificationMin;
    const max = p.magnificationMax;
    if (f.magnificationBand === "1-4") {
      if (max < 1 || min > 4) return false;
    } else if (f.magnificationBand === "4-8") {
      if (max < 4 || min > 8) return false;
    } else if (f.magnificationBand === "8+") {
      if (max < 8) return false;
    }
  }

  return true;
}

export function sortProducts(products: Product[], sort: SortKey) {
  const items = [...products];
  items.sort((a, b) => {
    if (sort === "popular") return b.popularity - a.popularity;
    if (sort === "priceAsc") return a.priceRub - b.priceRub;
    if (sort === "priceDesc") return b.priceRub - a.priceRub;
    return 0;
  });
  return items;
}

