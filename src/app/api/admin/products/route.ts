import { NextResponse } from "next/server";
import type { AdminProduct } from "@/lib/admin-types";
import { readAdminDb, writeAdminDb } from "@/lib/server/admin-db";

function nowIso() {
  return new Date().toISOString();
}

function generateId() {
  return `p_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

export async function GET() {
  const db = await readAdminDb();
  return NextResponse.json({ products: db.products });
}

export async function POST(req: Request) {
  const body = (await req.json()) as Partial<AdminProduct>;

  if (!body.name || !body.brand) {
    return NextResponse.json(
      { error: "name и brand обязательны" },
      { status: 400 },
    );
  }

  const db = await readAdminDb();
  const t = nowIso();

  const category =
    body.category === "thermal-monocular" ||
    body.category === "thermal-scope" ||
    body.category === "optical" ||
    body.category === "other" ||
    body.category === "collimator"
      ? body.category
      : "thermal-scope";

  const linkedCatalogProductId =
    typeof body.linkedCatalogProductId === "string" &&
    body.linkedCatalogProductId.trim()
      ? body.linkedCatalogProductId.trim()
      : null;

  const product: AdminProduct = {
    id: generateId(),
    name: String(body.name),
    brand: String(body.brand),
    priceRub: Number(body.priceRub ?? 0),
    category,
    magnification: String(body.magnification ?? ""),
    lensDiameterMm: Number(body.lensDiameterMm ?? 0),
    inStock: Boolean(body.inStock ?? true),
    linkedCatalogProductId,
    description: String(body.description ?? ""),
    specsText: String(body.specsText ?? ""),
    photoDataUrls: Array.isArray((body as any).photoDataUrls)
      ? ((body as any).photoDataUrls as unknown[]).filter((x) => typeof x === "string")
      : (body as any).photoDataUrl
        ? [String((body as any).photoDataUrl)]
        : [],
    createdAt: t,
    updatedAt: t,
  };

  db.products.unshift(product);
  await writeAdminDb(db);

  return NextResponse.json({ product }, { status: 201 });
}

