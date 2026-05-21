import { NextResponse } from "next/server";
import { repoGetProductPhotoSource } from "@/lib/server/admin-repository";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const index = Math.max(
    0,
    Number.parseInt(new URL(req.url).searchParams.get("index") ?? "0", 10) || 0,
  );

  try {
    const src = await repoGetProductPhotoSource(id, index);
    if (!src) return NextResponse.json({ error: "not found" }, { status: 404 });

    if (src.kind === "data") {
      return new NextResponse(new Uint8Array(src.buffer), {
        headers: {
          "Content-Type": src.mime,
          "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
        },
      });
    }

    const target =
      src.url.startsWith("/") || src.url.startsWith("//")
        ? new URL(src.url, new URL(req.url).origin).toString()
        : src.url;
    return NextResponse.redirect(target);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "failed to load photo" }, { status: 500 });
  }
}
