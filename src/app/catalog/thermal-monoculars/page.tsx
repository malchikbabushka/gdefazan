import type { Metadata } from "next";
import { ThermalMonocularsClient } from "./ThermalMonocularsClient";

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
    title: "Тепловизионные монокуляры",
    description:
      "Тепловизионные монокуляры для охоты и наблюдения: подбор по матрице, линзе и кратности. Наличие и цены.",
    alternates: { canonical: "/catalog/thermal-monoculars" },
    robots: indexable
      ? { index: true, follow: true }
      : { index: false, follow: true, googleBot: { index: false, follow: true } },
  };
}

export default function ThermalMonocularsPage() {
  return <ThermalMonocularsClient />;
}

