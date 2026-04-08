import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { PRODUCTS } from "@/lib/products";
import { formatRub } from "@/lib/catalog-logic";
import { absoluteUrl } from "@/lib/seo";
import { parseSpecsText } from "@/lib/specs-text";
import { findAdminOverlayForCatalogProduct } from "@/lib/server/catalog-admin-merge";
import { readAdminDb } from "@/lib/server/admin-db";
import type { Product } from "@/lib/catalog-types";
import {
  slugify,
  findProductBySlug,
  getProductUrl,
  getCategoryLabel,
  getCategoryPath,
} from "@/lib/product-utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  ProductJsonLd,
  BreadcrumbJsonLd,
  productBreadcrumbs,
} from "@/components/seo/JsonLd";
import { ProductActions } from "./ProductActions";
import { RelatedProducts } from "./RelatedProducts";
import { ProductGallery } from "./ProductGallery";

type Props = {
  params: Promise<{ slug: string }>;
};

export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  return PRODUCTS.map((p) => ({ slug: slugify(p.name) }));
}

async function findProductOrAdminBySlug(slug: string): Promise<
  | { kind: "catalog"; product: Product }
  | { kind: "admin"; product: Product }
  | null
> {
  const fromCatalog = findProductBySlug(slug);
  if (fromCatalog) return { kind: "catalog", product: fromCatalog };

  // Allow PDP for products created in admin (even if not present in src/lib/products.ts)
  const db = await readAdminDb();
  const admin = db.products.find((p) => slugify(p.name) === slug);
  if (!admin) return null;

  if (admin.category !== "thermal-scope" && admin.category !== "thermal-monocular") {
    return null;
  }

  const id =
    admin.linkedCatalogProductId && admin.linkedCatalogProductId.trim()
      ? admin.linkedCatalogProductId.trim()
      : `a_${admin.id}`;

  const product: Product = {
    id,
    name: admin.name,
    brand: admin.brand,
    type: admin.category === "thermal-monocular" ? "monocular" : "scope",
    priceRub: Number(admin.priceRub ?? 0),
    matrix: "640×512",
    lensMm: 35,
    magnificationMin: 1,
    magnificationMax: 4,
    hasRangefinder: false,
    inStock: Boolean(admin.inStock ?? true),
    popularity: 50,
  };

  return { kind: "admin", product };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const resolved = await findProductOrAdminBySlug(slug);
  if (!resolved) return { title: "Товар не найден" };
  const product = resolved.product;

  const admin = await findAdminOverlayForCatalogProduct(product);

  const typeLabel =
    product.type === "scope"
      ? "тепловизионный прицел"
      : "тепловизионный монокуляр";

  const title = `${product.brand} ${product.name} — ${typeLabel}`;
  const fallbackDescription = `Купить ${product.brand} ${product.name}: матрица ${product.matrix}, линза ${product.lensMm} мм, кратность ${product.magnificationMin}–${product.magnificationMax}×${product.hasRangefinder ? ", встроенный дальномер" : ""}. Цена ${formatRub(product.priceRub)}. ${product.inStock ? "В наличии" : "Под заказ"}.`;
  const description =
    admin?.description?.trim().length
      ? admin.description.trim()
      : fallbackDescription;

  const publicPhoto = admin?.photoDataUrls?.find(
    (u) => u.startsWith("/") || u.startsWith("http://") || u.startsWith("https://"),
  );
  const ogImageUrl = publicPhoto
    ? publicPhoto.startsWith("http")
      ? publicPhoto
      : absoluteUrl(publicPhoto)
    : absoluteUrl("/logo.png");

  return {
    title,
    description,
    alternates: { canonical: getProductUrl(product) },
    openGraph: {
      title,
      description,
      url: getProductUrl(product),
      type: "website",
      images: [{ url: ogImageUrl }],
    },
    twitter: {
      card: "summary",
      title,
      description,
      images: [ogImageUrl],
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const resolved = await findProductOrAdminBySlug(slug);
  if (!resolved) notFound();
  const product = resolved.product;

  const admin = await findAdminOverlayForCatalogProduct(product);
  const galleryImages = admin?.photoDataUrls?.filter(Boolean) ?? [];

  const crumbs = productBreadcrumbs(product);
  const typeLabel =
    product.type === "scope"
      ? "Тепловизионный прицел"
      : "Тепловизионный монокуляр";

  const shortDescription = `${product.brand} ${product.name} — ${
    product.type === "scope" ? "тепловизионный прицел" : "тепловизионный монокуляр"
  } для охоты. Матрица ${product.matrix}, линза ${product.lensMm} мм, кратность ${product.magnificationMin}–${product.magnificationMax}×${
    product.hasRangefinder ? ", встроенный дальномер" : ""
  }.`;

  const descriptionBody =
    admin?.description?.trim().length
      ? admin.description.trim()
      : shortDescription;

  const defaultSpecs = [
    { label: "Матрица", value: product.matrix },
    { label: "Диаметр линзы", value: `${product.lensMm} мм` },
    {
      label: "Кратность",
      value: `${product.magnificationMin}–${product.magnificationMax}×`,
    },
    { label: "Дальномер", value: product.hasRangefinder ? "Да" : "Нет" },
  ];

  const adminSpecItems = parseSpecsText(admin?.specsText ?? "");
  const hasAdminSpecs = adminSpecItems.some((x) => x.kind === "row");
  const specs = defaultSpecs;

  const jsonLdImages = galleryImages.filter(
    (u) => u.startsWith("/") || u.startsWith("http://") || u.startsWith("https://"),
  );

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
      {/* Breadcrumbs */}
      <nav aria-label="breadcrumb" className="mb-6 flex items-center gap-1 text-sm text-zinc-400">
        {crumbs.map((item, i) => (
          <span key={item.href} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-zinc-600" />}
            {i < crumbs.length - 1 ? (
              <Link
                href={item.href}
                className="transition hover:text-yellow-400"
              >
                {item.name}
              </Link>
            ) : (
              <span className="text-zinc-200">{item.name}</span>
            )}
          </span>
        ))}
      </nav>

      {/* Product layout */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Media + short specs + tabs (as requested: under photo and short specs) */}
        <div>
          <ProductGallery images={galleryImages} productName={product.name} />

          {/* Description / Specs tabs */}
          <Tabs defaultValue="description" className="mt-4 w-full">
            <TabsList className="w-full bg-white/5">
              <TabsTrigger value="description" className="flex-1">
                Описание
              </TabsTrigger>
              <TabsTrigger value="specs" className="flex-1">
                Характеристики
              </TabsTrigger>
            </TabsList>

            <TabsContent value="description" className="mt-3">
              <Card className="border-white/10 bg-white/5">
                <CardContent className="p-4">
                  <p className="whitespace-pre-wrap text-sm text-zinc-200/85">
                    {descriptionBody}
                  </p>
                  {!admin?.description?.trim().length ? (
                    <p className="mt-4 text-xs text-zinc-400">
                      Описание из админки не задано — показан автотекст из параметров витрины.
                      Укажите текст в админке или привяжите товар к карточке каталога.
                    </p>
                  ) : null}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="specs" className="mt-3">
              <Card className="border-white/10 bg-white/5">
                <CardContent className="p-0">
                  <Table>
                    <TableBody>
                      {hasAdminSpecs
                        ? adminSpecItems.map((it, idx) =>
                            it.kind === "section" ? (
                              <TableRow
                                key={`sec-${idx}-${it.title}`}
                                className="border-white/5 hover:bg-transparent"
                              >
                                <TableCell
                                  colSpan={2}
                                  className="bg-black/35 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-zinc-200/80"
                                >
                                  {it.title}
                                </TableCell>
                              </TableRow>
                            ) : (
                              <TableRow
                                key={`row-${idx}-${it.label}`}
                                className="border-white/5 hover:bg-white/5"
                              >
                                <TableCell className="w-1/2 py-2.5 pl-4 text-sm text-zinc-400">
                                  {it.label}
                                </TableCell>
                                <TableCell className="py-2.5 pr-4 text-sm font-medium text-zinc-100">
                                  {it.value || "—"}
                                </TableCell>
                              </TableRow>
                            ),
                          )
                        : specs.map((s) => (
                            <TableRow
                              key={s.label}
                              className="border-white/5 hover:bg-white/5"
                            >
                              <TableCell className="w-1/2 py-2.5 pl-4 text-sm text-zinc-400">
                                {s.label}
                              </TableCell>
                              <TableCell className="py-2.5 pr-4 text-sm font-medium text-zinc-100">
                                {s.value}
                              </TableCell>
                            </TableRow>
                          ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Info */}
        <div className="flex flex-col gap-5">
          <div>
            <p className="text-xs uppercase tracking-wide text-zinc-400">
              {product.brand} • {typeLabel}
            </p>
            <h1 className="mt-1 text-2xl font-bold text-zinc-50 sm:text-3xl">
              {product.name}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold text-yellow-400">
              {formatRub(product.priceRub)}
            </span>
            <Badge
              className={
                product.inStock
                  ? "border-green-500/30 bg-green-500/10 text-green-400"
                  : "border-orange-500/30 bg-orange-500/10 text-orange-400"
              }
            >
              {product.inStock ? "В наличии" : "Под заказ"}
            </Badge>
          </div>

          <Separator className="bg-white/10" />

          {/* Add to cart */}
          <ProductActions productId={product.id} />

          {/* Short specs (moved back under add-to-cart) */}
          <Card className="border-white/10 bg-white/5">
            <CardContent className="p-4">
              <h2 className="text-sm font-semibold text-zinc-200">
                Краткие характеристики
              </h2>
              <div className="mt-3 grid gap-2 text-sm text-zinc-300/80 sm:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-black/30 px-3 py-2">
                  Матрица: <span className="text-zinc-100">{product.matrix}</span>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/30 px-3 py-2">
                  Линза: <span className="text-zinc-100">{product.lensMm} мм</span>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/30 px-3 py-2">
                  Кратность:{" "}
                  <span className="text-zinc-100">
                    {product.magnificationMin}–{product.magnificationMax}×
                  </span>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/30 px-3 py-2">
                  Дальномер:{" "}
                  <span className="text-zinc-100">
                    {product.hasRangefinder ? "есть" : "нет"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>

      {/* Related products */}
      <RelatedProducts currentId={product.id} type={product.type} />

      {/* Structured data */}
      <ProductJsonLd
        product={product}
        descriptionOverride={admin?.description}
        imageUrls={jsonLdImages.length ? jsonLdImages : undefined}
      />
      <BreadcrumbJsonLd items={crumbs} />
    </main>
  );
}
