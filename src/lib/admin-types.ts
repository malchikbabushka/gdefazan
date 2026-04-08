export type AdminProductCategory =
  | "thermal-scope"
  | "thermal-monocular"
  | "optical"
  | "collimator"
  | "other";

export type AdminProduct = {
  id: string;
  name: string;
  brand: string;
  priceRub: number;
  category: AdminProductCategory;
  magnification: string;
  lensDiameterMm: number;
  inStock: boolean;
  /** Связь с карточкой витрины: id из каталога (например p1, p2). */
  linkedCatalogProductId: string | null;
  description: string;
  specsText: string;
  photoDataUrls: string[];
  createdAt: string;
  updatedAt: string;
};

export type AdminOrder = {
  id: string;
  totalRub: number;
  createdAt: string;
};

