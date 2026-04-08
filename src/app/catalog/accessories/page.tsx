import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Аксессуары",
  description:
    "Аксессуары для тепловизионных прицелов и монокуляров: крепления, питание, чехлы и другое. Раздел в разработке.",
  alternates: { canonical: "/catalog/accessories" },
  robots: { index: true, follow: true },
};

export default function AccessoriesPage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">
          Аксессуары
        </h1>
        <p className="mt-2 text-sm text-zinc-200/75">
          Раздел-заглушка. Здесь будут аксессуары и сопутствующие товары.
        </p>
      </div>
    </div>
  );
}

