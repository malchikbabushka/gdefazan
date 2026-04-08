export type PaymentMethod = "sberbank" | "mts-bank" | "evotor";

export type CreatePaymentRequest = {
  method: PaymentMethod;
  customer?: {
    name?: string;
    phone?: string;
    email?: string;
    address?: string;
  };
  items?: Array<{
    productId: string;
    name: string;
    priceRub: number;
    qty: number;
  }>;
  totalRub?: number;
};

export async function createDemoPayment(_req: CreatePaymentRequest) {
  // Демо: имитируем создание платежа и перенаправляем на success.
  // В будущем тут будет выбор адаптера: Сбербанк/МТС-Банк/Эвотор (54-ФЗ).
  return {
    ok: true,
    redirectUrl: "/checkout/success",
  };
}

