import type { AdminProduct, AdminProductCategory } from "@/lib/admin-types";
import type { Product, ProductType } from "@/lib/catalog-types";

function adminCategoryToType(category: AdminProductCategory): ProductType {
  if (category === "thermal-monocular") return "monocular";
  return "scope";
}

function normalizeLensMm(mm: number): Product["lensMm"] {
  const n = Number.isFinite(mm) ? Math.round(mm) : 35;
  if (n <= 22) return 19;
  if (n <= 30) return 25;
  if (n <= 42) return 35;
  return 50;
}

function parseMagnification(mag: string): { min: number; max: number } {
  const m = mag.match(/(\d+(?:[.,]\d+)?)\s*[-–—]\s*(\d+(?:[.,]\d+)?)/);
  if (m) {
    return {
      min: parseFloat(m[1]!.replace(",", ".")),
      max: parseFloat(m[2]!.replace(",", ".")),
    };
  }
  const single = mag.match(/(\d+(?:[.,]\d+)?)/);
  if (single) {
    const v = parseFloat(single[1]!.replace(",", "."));
    return { min: v, max: v };
  }
  return { min: 1, max: 4 };
}

/** Карточка витрины из записи админки (опубликованные). */
export function adminProductToCatalogProduct(a: AdminProduct): Product | null {
  if (a.published === false) return null;

  const linked =
    typeof a.linkedCatalogProductId === "string" && a.linkedCatalogProductId.trim()
      ? a.linkedCatalogProductId.trim()
      : null;
  const id = linked ?? `a_${a.id}`;
  const { min, max } = parseMagnification(a.magnification ?? "");

  return {
    id,
    brand: a.brand?.trim() || "Brand",
    name: a.name?.trim() || "Product",
    type: adminCategoryToType(a.category),
    priceRub: Number(a.priceRub ?? 0),
    matrix: "640×512",
    lensMm: normalizeLensMm(a.lensDiameterMm),
    magnificationMin: min,
    magnificationMax: max,
    hasRangefinder: false,
    inStock: Boolean(a.inStock ?? true),
    popularity: 50,
  };
}

export function catalogProductsFromAdmin(admin: AdminProduct[]): Product[] {
  const byId = new Map<string, Product>();
  for (const a of admin) {
    const p = adminProductToCatalogProduct(a);
    if (p) byId.set(p.id, p);
  }
  return Array.from(byId.values());
}
