import { SimpleContent } from "@/components/content/SimpleContent";
import { repoGetCmsPage } from "@/lib/server/admin-repository";
import type { Metadata } from "next";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Бренды",
  description:
    "Бренды тепловизионных прицелов, монокуляров и оптики. Подбор по производителям и линейкам.",
  alternates: { canonical: "/brands" },
  robots: { index: true, follow: true },
};

export default async function BrandsPage() {
  const content = await repoGetCmsPage("brands");
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <SimpleContent content={content} />
      <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="text-sm font-semibold text-zinc-50">Примеры брендов (витрина)</div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {["Raven", "Kestrel", "Vanguard", "Sentinel", "Nomad"].map((b) => (
            <div
              key={b}
              className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm font-semibold text-zinc-50"
            >
              {b}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
