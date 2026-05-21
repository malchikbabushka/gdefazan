import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/seo";
import { slugify } from "@/lib/product-utils";
import { repoListProducts } from "@/lib/server/admin-repository";
import { adminProductToCatalogProduct } from "@/lib/admin-catalog-map";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  const now = new Date();

  const pages = [
    "/",
    "/catalog",
    "/catalog/thermal-scopes",
    "/catalog/thermal-monoculars",
    "/catalog/optical-scopes",
    "/catalog/accessories",
    "/brands",
    "/warranty",
    "/shipping-payment",
    "/contacts",
  ];

  const pageEntries: MetadataRoute.Sitemap = pages.map((pathname) => ({
    url: `${base}${pathname}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: pathname === "/" ? 1 : 0.7,
  }));

  let productEntries: MetadataRoute.Sitemap = [];
  try {
    const admin = await repoListProducts(false);
    productEntries = admin
      .map((a) => adminProductToCatalogProduct(a))
      .filter((p): p is NonNullable<typeof p> => Boolean(p))
      .map((p) => ({
        url: `${base}/product/${slugify(p.name)}`,
        lastModified: now,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      }));
  } catch {
    /* Supabase недоступен при сборке — только статические страницы */
  }

  return [...pageEntries, ...productEntries];
}
