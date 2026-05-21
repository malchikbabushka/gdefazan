import { SimpleContent } from "@/components/content/SimpleContent";
import { repoGetCmsPage } from "@/lib/server/admin-repository";
import type { Metadata } from "next";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Гарантия и возврат",
  description:
    "Условия гарантии, обмена и возврата товаров. Порядок обращения и необходимые документы.",
  alternates: { canonical: "/warranty" },
  robots: { index: true, follow: true },
};

export default async function WarrantyPage() {
  const content = await repoGetCmsPage("warranty");
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <SimpleContent content={content} />
    </div>
  );
}
