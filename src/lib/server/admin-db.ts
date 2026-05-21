import { promises as fs } from "node:fs";
import path from "node:path";
import { cache } from "react";
import type { AdminOrder, AdminProduct } from "@/lib/admin-types";
import { AdminDemoFsReadOnlyError, isFsReadOnlyErrno } from "@/lib/server/admin-write-errors";

type AdminDb = {
  products: AdminProduct[];
  orders: AdminOrder[];
};

function getDbPath() {
  return path.join(process.cwd(), "data", "admin-db.json");
}

async function ensureDbFile() {
  const filePath = getDbPath();
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });
  try {
    await fs.access(filePath);
  } catch {
    const initial: AdminDb = { products: [], orders: [] };
    await fs.writeFile(filePath, JSON.stringify(initial, null, 2), "utf8");
  }
}

async function loadAdminDbFromDisk(): Promise<AdminDb> {
  await ensureDbFile();
  const raw = await fs.readFile(getDbPath(), "utf8");
  const parsed = JSON.parse(raw) as AdminDb;

  const productsRaw = Array.isArray(parsed.products) ? parsed.products : [];
  const products = productsRaw.map((p) => {
    const anyP = p as any;
    const legacySingle = typeof anyP.photoDataUrl === "string" ? anyP.photoDataUrl : null;
    const photos = Array.isArray(anyP.photoDataUrls)
      ? anyP.photoDataUrls.filter((x: unknown) => typeof x === "string")
      : legacySingle
        ? [legacySingle]
        : [];

    const stockQtyRaw = anyP.stockQty;
    const stockQty =
      typeof stockQtyRaw === "number" && Number.isFinite(stockQtyRaw)
        ? Math.max(0, Math.floor(stockQtyRaw))
        : 0;
    const published =
      typeof anyP.published === "boolean" ? anyP.published : true;

    return {
      ...anyP,
      stockQty,
      published,
      linkedCatalogProductId:
        typeof anyP.linkedCatalogProductId === "string" &&
        anyP.linkedCatalogProductId.trim()
          ? String(anyP.linkedCatalogProductId).trim()
          : null,
      description: typeof anyP.description === "string" ? anyP.description : "",
      specsText: typeof anyP.specsText === "string" ? anyP.specsText : "",
      photoDataUrls: photos,
    };
  });

  return {
    products,
    orders: Array.isArray(parsed.orders) ? parsed.orders : [],
  };
}

/**
 * In-process cache + single-flight: many parallel /photo requests share one disk read + JSON parse.
 * Bumped on write so admin changes are visible immediately after save.
 */
let dbVersion = 0;
let pendingRead: Promise<AdminDb> | null = null;
let snapshot: { version: number; data: AdminDb } | null = null;

export async function readAdminDb(): Promise<AdminDb> {
  if (snapshot && snapshot.version === dbVersion) {
    return snapshot.data;
  }

  if (!pendingRead) {
    const captureVersion = dbVersion;
    pendingRead = loadAdminDbFromDisk()
      .then((data) => {
        if (captureVersion === dbVersion) {
          snapshot = { version: dbVersion, data };
        }
        return data;
      })
      .finally(() => {
        pendingRead = null;
      });
  }

  await pendingRead;
  if (snapshot && snapshot.version === dbVersion) {
    return snapshot.data;
  }
  return readAdminDb();
}

export const readAdminDbCached = cache(readAdminDb);

export async function writeAdminDb(next: AdminDb) {
  dbVersion += 1;
  snapshot = null;
  pendingRead = null;
  try {
    await ensureDbFile();
    await fs.writeFile(getDbPath(), JSON.stringify(next, null, 2), "utf8");
  } catch (err: unknown) {
    const code = err && typeof err === "object" && "code" in err ? String((err as NodeJS.ErrnoException).code) : "";
    if (isFsReadOnlyErrno(code)) {
      throw new AdminDemoFsReadOnlyError();
    }
    throw err;
  }
}
