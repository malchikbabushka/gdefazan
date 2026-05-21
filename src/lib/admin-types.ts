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
  /** Остаток на складе (штук). */
  stockQty: number;
  /** Виден на витрине; false — не в каталоге/поиске, PDP по slug — 404. */
  published: boolean;
  category: AdminProductCategory;
  magnification: string;
  lensDiameterMm: number;
  inStock: boolean;
  /** Связь с карточкой витрины: id из каталога (например p1, p2). */
  linkedCatalogProductId: string | null;
  description: string;
  specsText: string;
  photoDataUrls: string[];
  /** Total photos (including data: URLs stripped from light API responses). */
  photoCount?: number;
  createdAt: string;
  updatedAt: string;
};

export type AdminOrderItem = {
  productId: string | null;
  productName: string;
  quantity: number;
  priceRub: number;
};

export type AdminOrder = {
  id: string;
  totalRub: number;
  createdAt: string;
  status?: string;
  customerEmail?: string | null;
  customerPhone?: string | null;
  customerName?: string | null;
  notes?: string | null;
  items?: AdminOrderItem[];
};

