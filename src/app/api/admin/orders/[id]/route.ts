import { NextResponse } from "next/server";
import { assertAdminSession } from "@/lib/server/admin-auth";
import { repoGetOrder } from "@/lib/server/admin-repository";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const denied = await assertAdminSession();
  if (denied) return denied;

  const { id } = await ctx.params;
  try {
    const order = await repoGetOrder(id);
    if (!order) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json({ order });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "failed to load order" }, { status: 500 });
  }
}
