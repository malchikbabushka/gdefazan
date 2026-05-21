import { NextResponse } from "next/server";
import { createDemoPayment, type CreatePaymentRequest } from "@/lib/payment";
import { repoRecordOrder } from "@/lib/server/admin-repository";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as CreatePaymentRequest;
    const res = await createDemoPayment(body);
    if (res.ok && body.items?.length && body.totalRub != null) {
      try {
        await repoRecordOrder({
          totalRub: Number(body.totalRub) || 0,
          customer: body.customer ?? {},
          items: body.items.map((it) => ({
            productId: it.productId,
            name: it.name,
            priceRub: Number(it.priceRub) || 0,
            qty: Number(it.qty) || 1,
          })),
        });
      } catch (e) {
        console.error("order record failed", e);
      }
    }
    return NextResponse.json(res);
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}

