"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  BarChart3,
  FileText,
  LogOut,
  Package,
  Settings,
  ShoppingBag,
  Table2,
  Menu,
} from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { Button, buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin/dashboard", label: "Дашборд", icon: BarChart3 },
  { href: "/admin/orders", label: "Заказы", icon: ShoppingBag },
  { href: "/admin/products/crud", label: "Товары", icon: Table2 },
  { href: "/admin/products/csv", label: "CSV", icon: Package },
  { href: "/admin/pages", label: "Страницы", icon: FileText },
  { href: "/admin/settings", label: "Настройки", icon: Settings },
] as const;

function TopNavLink({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        buttonVariants({ variant: "ghost", size: "sm" }),
        "h-9 shrink-0 gap-2 rounded-lg px-3 text-xs font-semibold sm:text-sm",
        active
          ? "border border-yellow-400/25 bg-yellow-400/10 text-yellow-100 hover:bg-yellow-400/15"
          : "border border-transparent text-zinc-200 hover:bg-white/10 hover:text-zinc-50",
      )}
    >
      <Icon className="h-4 w-4 opacity-90" />
      {label}
    </Link>
  );
}

type AdminChromeProps = {
  children: React.ReactNode;
  /** С сервера (layout): актуальные переменные на Vercel. */
  authConfigured: boolean;
  dbConfigured: boolean;
  onVercel: boolean;
};

export function AdminChrome({
  children,
  authConfigured,
  dbConfigured,
  onVercel,
}: AdminChromeProps) {
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  async function signOut() {
    if (!authConfigured) return;
    try {
      const client = createSupabaseBrowserClient();
      await client.auth.signOut();
    } catch {
      /* ignore */
    }
    window.location.href = "/admin/login";
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-zinc-950 text-zinc-50">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-black/90 backdrop-blur-md">
        <div className="flex h-14 w-full items-center justify-between gap-3 px-4 lg:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/admin/dashboard"
              className="shrink-0 text-sm font-bold tracking-tight text-zinc-50"
            >
              Thermal Admin
            </Link>
            <span className="hidden rounded-md border border-yellow-400/20 bg-yellow-400/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-yellow-100/90 sm:inline">
              Pro
            </span>
          </div>

          <nav className="hidden min-w-0 flex-1 items-center justify-center gap-1 overflow-x-auto px-2 md:flex lg:gap-2">
            {NAV.map((item) => {
              const productsActive =
                item.href === "/admin/products/crud" &&
                pathname.startsWith("/admin/products") &&
                !pathname.startsWith("/admin/products/csv");
              const csvActive =
                item.href === "/admin/products/csv" && pathname.startsWith("/admin/products/csv");
              const active = pathname === item.href || productsActive || csvActive;
              return <TopNavLink key={item.href} {...item} active={active} />;
            })}
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            {authConfigured ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="hidden h-9 rounded-lg border-white/10 bg-white/5 text-xs text-zinc-50 hover:bg-white/10 sm:inline-flex"
                onClick={() => void signOut()}
              >
                <LogOut className="mr-1.5 h-3.5 w-3.5" />
                Выйти
              </Button>
            ) : null}
            <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
              <SheetTrigger className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-zinc-50 md:hidden">
                <Menu className="h-5 w-5" />
              </SheetTrigger>
              <SheetContent side="right" className="border-white/10 bg-black/95 w-[280px]">
                <SheetHeader>
                  <SheetTitle className="text-zinc-50">Меню</SheetTitle>
                </SheetHeader>
                <Separator className="my-4 bg-white/10" />
                <div className="flex flex-col gap-2">
                  {NAV.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileNavOpen(false)}
                      className={cn(
                        buttonVariants({ variant: "ghost", size: "lg" }),
                        "justify-start gap-3 rounded-xl border border-white/10 bg-white/5",
                      )}
                    >
                      <item.icon className="h-4 w-4 text-yellow-100/90" />
                      {item.label}
                    </Link>
                  ))}
                  {authConfigured ? (
                    <Button
                      type="button"
                      variant="outline"
                      className="mt-4 justify-start gap-2 rounded-xl border-white/10"
                      onClick={() => void signOut()}
                    >
                      <LogOut className="h-4 w-4" />
                      Выйти
                    </Button>
                  ) : null}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <AdminModeNotice
        authConfigured={authConfigured}
        dbConfigured={dbConfigured}
        onVercel={onVercel}
      />

      <div className="w-full flex-1 px-4 py-4 lg:px-6 lg:py-6">{children}</div>
    </div>
  );
}

function AdminModeNotice({
  authConfigured,
  dbConfigured,
  onVercel,
}: {
  authConfigured: boolean;
  dbConfigured: boolean;
  onVercel: boolean;
}) {
  if (authConfigured && dbConfigured) {
    return null;
  }
  if (authConfigured && !dbConfigured) {
    return (
      <div className="border-b border-cyan-500/20 bg-cyan-500/10 px-4 py-2 text-center text-xs text-cyan-100/95 sm:text-left lg:px-6">
        <span className="font-semibold text-cyan-50">Supabase (вход есть):</span> для записи в БД и Storage в
        Vercel задайте <span className="font-mono">SUPABASE_SERVICE_ROLE_KEY</span> (Production) и сделайте
        Redeploy.
      </div>
    );
  }
  return (
    <div className="border-b border-amber-400/25 bg-amber-400/10 px-4 py-2 text-center text-xs text-amber-100/95 sm:text-left lg:px-6">
      <div>
        <span className="font-semibold text-amber-50">Демо-режим</span> —{" "}
        <span className="font-mono">data/admin-db.json</span>, без пароля. Ключи в{" "}
        <span className="font-mono">supabase/README.md</span>.
      </div>
      {onVercel ? (
        <div className="mt-2 space-y-2 border-t border-amber-400/20 pt-2 text-amber-50/95">
          <div>
            <span className="font-semibold">Vercel:</span> в демо-режиме файл в образе{" "}
            <span className="font-mono">только читается</span> — после <span className="font-mono">PUT</span> данные
            не остаются на диске сервера. Для реального магазина подключите Supabase (переменные в{" "}
            <span className="font-mono">.env.example</span>).
          </div>
          <div className="text-amber-100/85">
            <span className="font-semibold">Почему «всё по кругу»:</span> правки в Cursor не попадают на сайт сами
            по себе. Если страница{" "}
            <a
              href="/api/admin/diagnostics/env"
              className="font-mono underline decoration-amber-400/50 underline-offset-2 hover:text-amber-50"
            >
              /api/admin/diagnostics/env
            </a>{" "}
            открывается с <span className="font-mono">404</span>, на Vercel до сих пор{" "}
            <span className="font-semibold">старая сборка</span> — сделайте деплой из папки проекта:{" "}
            <span className="font-mono">npm run deploy:vercel</span> (или push в GitHub, если проект с ним связан).
          </div>
        </div>
      ) : null}
    </div>
  );
}
