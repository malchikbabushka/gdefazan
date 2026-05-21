"use client";

import { usePathname } from "next/navigation";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";

/** Скрывает шапку/подвал витрины на маршрутах админки — меньше лишнего JS и понятнее интерфейс. */
export function StorefrontShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) {
    return <>{children}</>;
  }
  return (
    <>
      <SiteHeader />
      {children}
      <SiteFooter />
    </>
  );
}
