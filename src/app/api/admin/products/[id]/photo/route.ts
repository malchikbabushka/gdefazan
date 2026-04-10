import { NextResponse } from "next/server";
import { readAdminDb } from "@/lib/server/admin-db";

type Ctx = { params: Promise<{ id: string }> };

function parseDataUrl(dataUrl: string): { mime: string; buffer: Buffer } | null {
  const m = dataUrl.match(/^data:([^;,]+)(;base64)?,([\s\S]+)$/);
  if (!m?.[3]) return null;
  const mime = m[1]!;
  const isBase64 = m[2] === ";base64";
  const payload = m[3]!;
  if (isBase64) {
    try {
      return { mime, buffer: Buffer.from(payload, "base64") };
    } catch {
      return null;
    }
  }
  try {
    return { mime, buffer: Buffer.from(decodeURIComponent(payload), "utf8") };
  } catch {
    return null;
  }
}

export async function GET(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const index = Math.max(
    0,
    Number.parseInt(new URL(req.url).searchParams.get("index") ?? "0", 10) || 0,
  );

  const db = await readAdminDb();
  const product = db.products.find((p) => p.id === id);
  if (!product) return NextResponse.json({ error: "not found" }, { status: 404 });

  const urls = Array.isArray(product.photoDataUrls)
    ? product.photoDataUrls.filter((u): u is string => typeof u === "string" && u.length > 0)
    : [];
  const src = urls[index];
  if (!src) return NextResponse.json({ error: "not found" }, { status: 404 });

  if (src.startsWith("data:")) {
    const parsed = parseDataUrl(src);
    if (!parsed) return NextResponse.json({ error: "bad data url" }, { status: 400 });
    return new NextResponse(new Uint8Array(parsed.buffer), {
      headers: {
        "Content-Type": parsed.mime,
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    });
  }

  if (src.startsWith("http://") || src.startsWith("https://")) {
    return NextResponse.redirect(src);
  }

  if (src.startsWith("/")) {
    const origin = new URL(req.url).origin;
    return NextResponse.redirect(new URL(src, origin).toString());
  }

  return NextResponse.json({ error: "unsupported" }, { status: 400 });
}
