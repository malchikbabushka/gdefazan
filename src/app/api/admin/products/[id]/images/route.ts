import { NextResponse } from "next/server";
import { assertAdminSession } from "@/lib/server/admin-auth";
import { isSupabaseConfigured } from "@/lib/env/supabase";
import { repoGetProduct, repoUploadProductImageBuffers } from "@/lib/server/admin-repository";

type Ctx = { params: Promise<{ id: string }> };

function extFromMime(mime: string, filename: string): string {
  const lower = filename.toLowerCase();
  const dot = lower.lastIndexOf(".");
  if (dot !== -1 && lower.length - dot <= 5) {
    return lower.slice(dot + 1) || "bin";
  }
  if (mime.includes("png")) return "png";
  if (mime.includes("webp")) return "webp";
  if (mime.includes("gif")) return "gif";
  if (mime.includes("jpeg") || mime.includes("jpg")) return "jpg";
  return "jpg";
}

export async function POST(req: Request, ctx: Ctx) {
  const denied = await assertAdminSession();
  if (denied) return denied;

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase Storage не настроен — загрузите фото как раньше (встраивание в JSON)." },
      { status: 400 },
    );
  }

  const { id: productId } = await ctx.params;
  const existing = await repoGetProduct(productId, false);
  if (!existing) return NextResponse.json({ error: "product not found" }, { status: 404 });

  const form = await req.formData();
  const files = form.getAll("file").filter((x): x is File => x instanceof File);
  if (!files.length) {
    return NextResponse.json({ error: "no files" }, { status: 400 });
  }

  const buffers: Array<{ buffer: Buffer; contentType: string; ext: string }> = [];
  for (const file of files) {
    const ab = await file.arrayBuffer();
    buffers.push({
      buffer: Buffer.from(ab),
      contentType: file.type || "application/octet-stream",
      ext: extFromMime(file.type || "", file.name || ""),
    });
  }

  try {
    const urls = await repoUploadProductImageBuffers(productId, buffers);
    const full = await repoGetProduct(productId, true);
    return NextResponse.json({ urls, photoDataUrls: full?.photoDataUrls ?? urls });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "upload failed" }, { status: 500 });
  }
}
