import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/seo";
import { PRODUCTS } from "@/lib/products";
import { slugify } from "@/lib/product-utils";

export default function sitemap(): MetadataRoute.Sitemap {
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
  ];

  const pageEntries: MetadataRoute.Sitemap = pages.map((pathname) => ({
    url: `${base}${pathname}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: pathname === "/" ? 1 : 0.7,
  }));

  const productEntries: MetadataRoute.Sitemap = PRODUCTS.map((p) => ({
    url: `${base}/product/${slugify(p.name)}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...pageEntries, ...productEntries];
}

