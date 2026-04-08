import type { Metadata } from "next";
import { Manrope, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { TooltipProvider } from "@/components/ui/tooltip";
import { OrganizationJsonLd, WebSiteJsonLd } from "@/components/seo/JsonLd";
import { getSiteUrl } from "@/lib/seo";
import { SiteFooter } from "@/components/layout/SiteFooter";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ru"
      className={`${manrope.variable} ${geistMono.variable} dark h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <TooltipProvider>
          <SiteHeader />
          {children}
          <SiteFooter />
          <OrganizationJsonLd />
          <WebSiteJsonLd />
        </TooltipProvider>
      </body>
    </html>
  );
}
