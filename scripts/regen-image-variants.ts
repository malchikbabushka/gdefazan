import path from "node:path";
import { config } from "dotenv";

config({ path: path.join(process.cwd(), ".env.local") });
config({ path: path.join(process.cwd(), ".env") });
import sharp from "sharp";
import { createClient } from "@supabase/supabase-js";

const BUCKET = "product-images";

function required(name: string): string {
  const v = process.env[name];
  if (!v || !v.trim()) throw new Error(`Missing env: ${name}`);
  return v.trim();
}

function basePublicUrl(): string {
  return required("NEXT_PUBLIC_SUPABASE_URL").replace(/\/$/, "");
}

function toPublicUrl(storagePath: string): string {
  return `${basePublicUrl()}/storage/v1/object/public/${BUCKET}/${storagePath}`;
}

function deriveVariantPath(storagePath: string, width: 320 | 960): string {
  // Convert any ".../file.ext" or ".../file_w960.webp" to ".../file_w{width}.webp"
  const noQuery = storagePath.split("?")[0]!;
  const m = noQuery.match(/^(.*?)(?:_w(320|960)\.webp)?(?:\.[a-z0-9]+)?$/i);
  const base = m?.[1] ? m[1] : noQuery;
  return `${base}_w${width}.webp`;
}

async function ensureVariant(
  sb: ReturnType<typeof createClient>,
  originalPath: string,
): Promise<{ mainPath: string; thumbPath: string }> {
  // Download original (could be large jpg/png/webp).
  const { data, error } = await sb.storage.from(BUCKET).download(originalPath);
  if (error) throw error;
  const ab = await data.arrayBuffer();
  const buf = Buffer.from(ab);

  const input = sharp(buf, { failOn: "none" }).rotate();
  const thumbPath = deriveVariantPath(originalPath, 320);
  const mainPath = deriveVariantPath(originalPath, 960);

  const [thumb, main] = await Promise.all([
    input.clone().resize({ width: 320, withoutEnlargement: true }).webp({ quality: 72 }).toBuffer(),
    input.clone().resize({ width: 960, withoutEnlargement: true }).webp({ quality: 78 }).toBuffer(),
  ]);

  const up1 = await sb.storage.from(BUCKET).upload(thumbPath, thumb, {
    contentType: "image/webp",
    upsert: true,
  });
  if (up1.error) throw up1.error;
  const up2 = await sb.storage.from(BUCKET).upload(mainPath, main, {
    contentType: "image/webp",
    upsert: true,
  });
  if (up2.error) throw up2.error;

  return { mainPath, thumbPath };
}

async function main() {
  const url = required("NEXT_PUBLIC_SUPABASE_URL");
  const service = required("SUPABASE_SERVICE_ROLE_KEY");
  const sb = createClient(url, service, { auth: { persistSession: false } });

  let updated = 0;
  let scanned = 0;

  // Page through product_images.
  const pageSize = 500;
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await sb
      .from("product_images")
      .select("product_id, sort_order, public_url, storage_path")
      .order("product_id", { ascending: true })
      .range(from, from + pageSize - 1);
    if (error) throw error;
    const rows = (data ?? []) as Array<{
      product_id: string;
      sort_order: number;
      public_url: string;
      storage_path: string | null;
    }>;
    if (!rows.length) break;

    for (const r of rows) {
      scanned += 1;
      const storagePath =
        r.storage_path && r.storage_path.trim()
          ? r.storage_path.trim()
          : (() => {
              const marker = `/storage/v1/object/public/${BUCKET}/`;
              const idx = r.public_url.indexOf(marker);
              return idx !== -1 ? r.public_url.slice(idx + marker.length) : "";
            })();
      if (!storagePath) continue;

      // If already points to _w960.webp, just ensure thumb exists.
      const looksOptimized = /_w960\.webp$/i.test(storagePath);
      const { mainPath } = await ensureVariant(sb, storagePath);

      // Update DB row to point to optimized 960w URL/path.
      if (!looksOptimized || storagePath !== mainPath) {
        const nextUrl = toPublicUrl(mainPath);
        const { error: uErr } = await sb
          .from("product_images")
          .update({ storage_path: mainPath, public_url: nextUrl })
          .eq("product_id", r.product_id)
          .eq("sort_order", r.sort_order);
        if (uErr) throw uErr;
        updated += 1;
      }
    }
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        scanned,
        updatedRows: updated,
        note:
          "Готово. Витрина начнет использовать *_w320.webp и *_w960.webp для новых и старых фото.",
      },
      null,
      2,
    ),
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

