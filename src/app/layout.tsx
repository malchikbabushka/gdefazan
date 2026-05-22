import type { Metadata } from "next";
import { Manrope, Geist_Mono } from "next/font/google";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { OrganizationJsonLd, WebSiteJsonLd } from "@/components/seo/JsonLd";
import { getSiteUrl } from "@/lib/seo";
import { AppProviders } from "@/components/providers/AppProviders";
import { StorefrontShell } from "@/components/layout/StorefrontShell";
import { getStorefrontCatalog } from "@/lib/server/storefront-catalog";

const manrope = Manrope({
  variable: "--font-sans",
  subsets: ["cyrillic", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: "ГДЕ ФАЗАН?! — тепловизоры и прицелы для охоты",
    template: "%s — ГДЕ ФАЗАН?!",
  },
  description:
    "Интернет-магазин тепловизионных прицелов, монокуляров и оптики для охоты. Подбор, наличие, доставка по РФ.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "ru_RU",
    siteName: "ГДЕ ФАЗАН?!",
    title: "ГДЕ ФАЗАН?! — тепловизоры и прицелы для охоты",
    description:
      "Интернет-магазин тепловизионных прицелов, монокуляров и оптики для охоты. Подбор, наличие, доставка по РФ.",
    url: "/",
    images: [{ url: "/logo.png" }],
  },
  twitter: {
    card: "summary",
    title: "ГДЕ ФАЗАН?! — тепловизоры и прицелы для охоты",
    description:
      "Интернет-магазин тепловизионных прицелов, монокуляров и оптики для охоты. Подбор, наличие, доставка по РФ.",
    images: ["/logo.png"],
  },
  icons: {
    icon: [{ url: "/logo.png" }],
    apple: [{ url: "/logo.png" }],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let initialCatalog = { products: [], adminProducts: [] };
  try {
    initialCatalog = await getStorefrontCatalog();
  } catch (e) {
    console.error("[layout] getStorefrontCatalog", e);
  }

  return (
    <html
      lang="ru"
      className={`${manrope.variable} ${geistMono.variable} dark h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <TooltipProvider>
          <AppProviders initialCatalog={initialCatalog}>
            <StorefrontShell>{children}</StorefrontShell>
            <OrganizationJsonLd />
            <WebSiteJsonLd />
          </AppProviders>
        </TooltipProvider>
      </body>
    </html>
  );
}
