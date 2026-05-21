import { NextResponse } from "next/server";
import type { AdminProductCategory } from "@/lib/admin-types";
import { assertAdminSession } from "@/lib/server/admin-auth";
import {
  AdminDemoFsReadOnlyError,
  safeClientErrorMessage,
} from "@/lib/server/admin-write-errors";
import { vercelAdminWritesBlockedResponse } from "@/lib/server/vercel-admin-write-guard";
import {
  repoBulkProducts,
  type ProductBulkOp,
  type ProductBulkPayload,
} from "@/lib/server/admin-repository";

const OPS: ProductBulkOp[] = [
  "delete",
  "setInStock",
  "setPublished",
  "setStockQty",
  "setPriceRub",
  "adjustPricePercent",
  "setCategory",
];

const CATEGORIES: AdminProductCategory[] = [
  "thermal-scope",
  "thermal-monocular",
  "optical",
  "collimator",
  "other",
];

export async function POST(req: Request) {
  const denied = await assertAdminSession();
  if (denied) return denied;

  const blocked = vercelAdminWritesBlockedResponse();
  if (blocked) return blocked;

  try {
    const body = (await req.json()) as {
      ids?: unknown;
      op?: unknown;
      payload?: ProductBulkPayload;
    };
    const ids = Array.isArray(body.ids)
      ? body.ids.filter((x): x is string => typeof x === "string")
      : [];
    const op = typeof body.op === "string" ? body.op : "";
    if (!ids.length || !OPS.includes(op as ProductBulkOp)) {
      return NextResponse.json({ error: "invalid body" }, { status: 400 });
    }

    const payload = body.payload && typeof body.payload === "object" ? body.payload : {};

    if (op === "setCategory" && payload.category !== undefined) {
      if (!CATEGORIES.includes(payload.category as AdminProductCategory)) {
        return NextResponse.json({ error: "invalid category" }, { status: 400 });
      }
    }

    await repoBulkProducts(ids, op as ProductBulkOp, payload);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[POST /api/admin/products/bulk]", e);
    if (e instanceof AdminDemoFsReadOnlyError) {
      return NextResponse.json({ error: e.clientMessage }, { status: 503 });
    }
    const hint = safeClientErrorMessage(e);
    return NextResponse.json({ error: hint ?? "bulk failed" }, { status: 500 });
  }
}
