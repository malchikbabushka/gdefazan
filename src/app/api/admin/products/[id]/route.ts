import { NextResponse } from "next/server";
import type { AdminProduct } from "@/lib/admin-types";
import { readAdminDb, writeAdminDb } from "@/lib/server/admin-db";

function nowIso() {
  return new Date().toISOString();
}

function isPublicPhotoUrl(u: string) {
  return u.startsWith("/") || u.startsWith("http://") || u.startsWith("https://");
}

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const db = await readAdminDb();
  const product = db.products.find((p) => p.id === id);
  if (!product) return NextResponse.json({ error: "not found" }, { status: 404 });

  const url = new URL(req.url);
  const includePhotos =
    url.searchParams.get("includePhotos") === "1" ||
    url.searchParams.get("includePhotos") === "true";
  if (includePhotos) return NextResponse.json({ product });

  return NextResponse.json({
    product: {
      ...product,
      photoDataUrls: Array.isArray(product.photoDataUrls)
        ? product.photoDataUrls.filter(
            (u) => typeof u === "string" && isPublicPhotoUrl(u),
          )
        : [],
    } satisfies AdminProduct,
  });
}

export async function PUT(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const patch = (await req.json()) as Partial<AdminProduct>;
  const db = await readAdminDb();

  const idx = db.products.findIndex((p) => p.id === id);
  if (idx === -1) return NextResponse.json({ error: "not found" }, { status: 404 });

  const prev = db.products[idx]!;
  const category =
    patch.category === undefined
      ? prev.category
      : patch.category === "thermal-scope" ||
          patch.category === "thermal-monocular" ||
          patch.category === "optical" ||
          patch.category === "collimator" ||
          patch.category === "other"
        ? patch.category
        : prev.category;
  const next: AdminProduct = {
    ...prev,
    name: patch.name !== undefined ? String(patch.name) : prev.name,
    brand: patch.brand !== undefined ? String(patch.brand) : prev.brand,
    priceRub: patch.priceRub !== undefined ? Number(patch.priceRub) : prev.priceRub,
    category,
    magnification:
      patch.magnification !== undefined ? String(patch.magnification) : prev.magnification,
    lensDiameterMm:
      patch.lensDiameterMm !== undefined
        ? Number(patch.lensDiameterMm)
        : prev.lensDiameterMm,
    inStock: patch.inStock !== undefined ? Boolean(patch.inStock) : prev.inStock,
    linkedCatalogProductId:
      patch.linkedCatalogProductId !== undefined
        ? typeof patch.linkedCatalogProductId === "string" &&
          patch.linkedCatalogProductId.trim()
          ? patch.linkedCatalogProductId.trim()
          : null
        : prev.linkedCatalogProductId,
    description:
      patch.description !== undefined ? String(patch.description) : prev.description,
    specsText: patch.specsText !== undefined ? String(patch.specsText) : prev.specsText,
    photoDataUrls:
      (patch as any).photoDataUrls !== undefined
        ? Array.isArray((patch as any).photoDataUrls)
          ? ((patch as any).photoDataUrls as unknown[]).filter((x) => typeof x === "string")
          : []
        : prev.photoDataUrls,
    updatedAt: nowIso(),
  };

  db.products[idx] = next;
  await writeAdminDb(db);

  return NextResponse.json({ product: next });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const db = await readAdminDb();
  const before = db.products.length;
  db.products = db.products.filter((p) => p.id !== id);
  if (db.products.length === before) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  await writeAdminDb(db);
  return NextResponse.json({ ok: true });
}

