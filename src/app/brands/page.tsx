import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Бренды",
  description:
    "Бренды тепловизионных прицелов, монокуляров и оптики. Подбор по производителям и линейкам.",
  alternates: { canonical: "/brands" },
  robots: { index: true, follow: true },
};

export default function BrandsPage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">
          Бренды
        </h1>
        <p className="mt-2 text-sm text-zinc-200/75">
          Демо-страница. Сюда обычно выводят список брендов, фильтры и логотипы.
        </p>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
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

