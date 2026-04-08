import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  const base = getSiteUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/catalog", "/catalog/*", "/product", "/product/*", "/brands", "/brands/*", "/warranty", "/shipping-payment"],
        disallow: ["/admin", "/admin/*", "/api", "/api/*", "/cart", "/checkout", "/account", "/account/*"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}

