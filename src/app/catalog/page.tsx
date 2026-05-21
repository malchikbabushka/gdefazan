import { HomePage } from "@/components/home/HomePage";
import type { Metadata } from "next";
import { Suspense } from "react";

function hasSearchParams(searchParams: Record<string, string | string[] | undefined>) {
  return Object.values(searchParams).some((v) =>
    Array.isArray(v) ? v.length > 0 : typeof v === "string" && v.trim().length > 0,
  );
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const resolved = await searchParams;
  const indexable = !hasSearchParams(resolved);

  return {
    title: "Каталог",
    description:
      "Каталог тепловизионных прицелов, монокуляров, оптики и аксессуаров. Подбор по матрице, линзе, кратности и наличию.",
    alternates: { canonical: "/catalog" },
    robots: indexable
      ? { index: true, follow: true }
      : { index: false, follow: true, googleBot: { index: false, follow: true } },
  };
}

export default function CatalogPage() {
  return (
    <Suspense fallback={<div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8" />}>
      <HomePage />
    </Suspense>
  );
}

