import type { Product } from "@/lib/catalog-types";
import { formatRub } from "@/lib/catalog-logic";
import { absoluteUrl, getSiteUrl } from "@/lib/seo";
import { getProductUrl, getCategoryLabel, getCategoryPath } from "@/lib/product-utils";

type JsonLdProps<T> = {
  data: T;
};

function JsonLd<T>({ data }: JsonLdProps<T>) {
  return (
    <script
      type="application/ld+json"
      // JSON-LD is meant to be injected as a raw JSON string.
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function OrganizationJsonLd() {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "ГДЕ ФАЗАН?!",
        url: getSiteUrl(),
        logo: absoluteUrl("/logo.png"),
        contactPoint: [
          {
            "@type": "ContactPoint",
            telephone: "+7 (999) 123-45-67",
            contactType: "customer service",
            areaServed: "RU",
            availableLanguage: ["ru"],
          },
        ],
      }}
    />
  );
}

export function WebSiteJsonLd() {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: "ГДЕ ФАЗАН?!",
        url: getSiteUrl(),
        potentialAction: {
          "@type": "SearchAction",
          target: `${getSiteUrl()}/catalog?q={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      }}
    />
  );
}

function publicImageUrlsForSchema(urls: string[] | undefined) {
  if (!urls?.length) return [absoluteUrl("/logo.png")];
  const out = urls
    .filter((u) => typeof u === "string")
    .map((u) => {
      if (u.startsWith("http://") || u.startsWith("https://")) return u;
      if (u.startsWith("/")) return absoluteUrl(u);
      return null;
    })
    .filter(Boolean) as string[];
  return out.length ? out : [absoluteUrl("/logo.png")];
}

export function ProductJsonLd({
  product,
  descriptionOverride,
  imageUrls,
}: {
  product: Product;
  descriptionOverride?: string;
  imageUrls?: string[];
}) {
  const fallbackDescription = `${product.brand} ${product.name} — ${product.type === "scope" ? "тепловизионный прицел" : "тепловизионный монокуляр"}, матрица ${product.matrix}, линза ${product.lensMm} мм, кратность ${product.magnificationMin}–${product.magnificationMax}×${product.hasRangefinder ? ", встроенный дальномер" : ""}`;
  const description =
    descriptionOverride && descriptionOverride.trim()
      ? descriptionOverride.trim()
      : fallbackDescription;

  const images = publicImageUrlsForSchema(imageUrls);

  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.name,
        brand: { "@type": "Brand", name: product.brand },
        description,
        sku: product.id,
        image: images.length === 1 ? images[0] : images,
        url: absoluteUrl(getProductUrl(product)),
        offers: {
          "@type": "Offer",
          url: absoluteUrl(getProductUrl(product)),
          priceCurrency: "RUB",
          price: product.priceRub,
          priceValidUntil: new Date(Date.now() + 90 * 86400000)
            .toISOString()
            .slice(0, 10),
          availability: product.inStock
            ? "https://schema.org/InStock"
            : "https://schema.org/PreOrder",
          itemCondition: "https://schema.org/NewCondition",
          seller: { "@type": "Organization", name: "ГДЕ ФАЗАН?!" },
        },
      }}
    />
  );
}

export function BreadcrumbJsonLd({
  items,
}: {
  items: { name: string; href: string }[];
}) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: items.map((item, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: item.name,
          item: absoluteUrl(item.href),
        })),
      }}
    />
  );
}

export function productBreadcrumbs(product: Product) {
  return [
    { name: "Главная", href: "/" },
    { name: getCategoryLabel(product.type), href: getCategoryPath(product.type) },
    { name: product.name, href: getProductUrl(product) },
  ];
}

