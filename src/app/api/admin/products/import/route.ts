import { NextResponse } from "next/server";
import { z } from "zod";
import { assertAdminSession } from "@/lib/server/admin-auth";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { safeClientErrorMessage } from "@/lib/server/admin-write-errors";

export const dynamic = "force-dynamic";

const PatchSchema = z
  .object({
    priceRub: z.number().int().nonnegative().optional(),
    stockQty: z.number().int().nonnegative().optional(),
    inStock: z.boolean().optional(),
  })
  .strict();

const BodySchema = z
  .object({
    mode: z.literal("updateOnly"),
    ops: z.array(
      z
        .object({
          id: z.string().min(1),
          patch: PatchSchema,
        })
        .strict(),
    ),
  })
  .strict();

export async function POST(req: Request) {
  const denied = await assertAdminSession();
  if (denied) return denied;

  try {
    const raw = await req.json();
    const body = BodySchema.parse(raw);
    if (body.ops.length === 0) return NextResponse.json({ updated: 0 });

    const sb = createServiceRoleClient();

    // PostgREST doesn't support per-row varying updates in one statement without RPC.
    // Apply sequentially (small chunks are sent by client).
    let updated = 0;
    for (const op of body.ops) {
      const patch = op.patch;
      if (!Object.keys(patch).length) continue;
      const { error } = await sb
        .from("admin_products")
        .update({
          price_rub: patch.priceRub,
          stock_qty: patch.stockQty,
          in_stock: patch.inStock,
          updated_at: new Date().toISOString(),
        })
        .eq("id", op.id);
      if (error) throw error;
      updated += 1;
    }

    return NextResponse.json({ updated });
  } catch (e) {
    console.error("[POST /api/admin/products/import]", e);
    const hint = safeClientErrorMessage(e);
    return NextResponse.json({ error: hint ?? "import failed" }, { status: 500 });
  }
}

