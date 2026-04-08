import { NextResponse } from "next/server";
import { createDemoPayment } from "@/lib/payment";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const res = await createDemoPayment(body);
    return NextResponse.json(res);
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}

