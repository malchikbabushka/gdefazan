import type { Metadata } from "next";
import { ThermalScopesClient } from "./ThermalScopesClient";

function hasSearchParams(searchParams: Record<string, string | string[] | undefined>) {
  return Object.values(searchParams).some((v) =>
    Array.isArray(v) ? v.length > 0 : typeof v === "string" && v.trim().length > 0,
  );
}

export function generateMetadata({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}): Metadata {
  const indexable = !hasSearchParams(searchParams);

  return {
    title: "Тепловизионные прицелы",
    description:
      "Тепловизионные прицелы для охоты: подбор по матрице, линзе, кратности и наличию дальномера. Наличие и цены.",
    alternates: { canonical: "/catalog/thermal-scopes" },
    robots: indexable
      ? { index: true, follow: true }
      : { index: false, follow: true, googleBot: { index: false, follow: true } },
  };
}

export default function ThermalScopesPage() {
  return <ThermalScopesClient />;
}

