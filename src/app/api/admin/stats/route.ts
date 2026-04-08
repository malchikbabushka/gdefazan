import { NextResponse } from "next/server";
import { readAdminDb } from "@/lib/server/admin-db";

export async function GET() {
  const db = await readAdminDb();

  const inStockCount = db.products.filter((p) => p.inStock).length;
  const totalProducts = db.products.length;

  const now = Date.now();
  const days30 = 30 * 24 * 60 * 60 * 1000;
  const recentOrders = db.orders.filter((o) => {
    const t = new Date(o.createdAt).getTime();
    return Number.isFinite(t) && now - t <= days30;
  });
  const ordersCount = recentOrders.length;
  const revenueRub = recentOrders.reduce((sum, o) => sum + (Number(o.totalRub) || 0), 0);

  return NextResponse.json({
    revenueRub,
    ordersCount,
    inStockCount,
    totalProducts,
  });
}

