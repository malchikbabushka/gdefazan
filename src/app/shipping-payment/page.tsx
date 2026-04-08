import { SimpleContent } from "@/components/content/SimpleContent";
import { getPageContent, loadPagesFromStorage } from "@/lib/pages-store";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Доставка и оплата",
  description:
    "Условия доставки и способы оплаты. Консультация по заказу и подбору оборудования.",
  alternates: { canonical: "/shipping-payment" },
  robots: { index: true, follow: true },
};

export default function ShippingPaymentPage() {
  const stored = loadPagesFromStorage();
  const content = getPageContent("shipping-payment", stored);
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <SimpleContent content={content} />
    </div>
  );
}

