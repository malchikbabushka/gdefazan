import { NextResponse } from "next/server";
import { assertAdminSession } from "@/lib/server/admin-auth";
import { repoListOrders } from "@/lib/server/admin-repository";

export async function GET() {
  const denied = await assertAdminSession();
  if (denied) return denied;

  try {
    const orders = await repoListOrders();
    return NextResponse.json({ orders });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "failed to list orders" }, { status: 500 });
  }
}
