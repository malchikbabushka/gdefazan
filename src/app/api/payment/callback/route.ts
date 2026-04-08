import { NextResponse } from "next/server";

export async function POST() {
  // Заглушка под webhook/callback банков и Эвотора.
  // В продакшене здесь будет валидация подписи и обновление статуса платежа/заказа.
  return NextResponse.json({ ok: true });
}

