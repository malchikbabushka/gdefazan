export type Matrix =
  | "384×288"
  | "640×512"
  | "1024×768"
  | "1280×1024";

export type ProductType = "scope" | "monocular";

export type Product = {
  id: string;
  name: string;
  brand: string;
  type: ProductType;
  priceRub: number;
  matrix: Matrix;
  lensMm: 19 | 25 | 35 | 50;
  magnificationMin: number;
  magnificationMax: number;
  hasRangefinder: boolean;
  inStock: boolean;
  popularity: number;
};

export type SortKey = "popular" | "priceAsc" | "priceDesc";

export type CatalogFilters = {
  query: string;
  priceMin?: number;
  priceMax?: number;
  deviceTypes: Set<ProductType>;
  matrices: Set<Matrix>;
  lenses: Set<Product["lensMm"]>;
  magnificationBand: "any" | "1-4" | "4-8" | "8+";
  rangefinderOnly: boolean;
  inStockOnly: boolean;
};

