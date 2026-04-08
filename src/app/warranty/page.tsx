import { SimpleContent } from "@/components/content/SimpleContent";
import { getPageContent, loadPagesFromStorage } from "@/lib/pages-store";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Гарантия и возврат",
  description:
    "Условия гарантии, обмена и возврата товаров. Порядок обращения и необходимые документы.",
  alternates: { canonical: "/warranty" },
  robots: { index: true, follow: true },
};

export default function WarrantyPage() {
  const stored = loadPagesFromStorage();
  const content = getPageContent("warranty", stored);
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <SimpleContent content={content} />
    </div>
  );
}

