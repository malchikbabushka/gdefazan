import Link from "next/link";
import type { Metadata } from "next";
import { BarChart3, FileText, Package, Settings, Table2, Menu } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Admin",
  robots: {
    index: false,
    follow: false,
  },
};

function NavLink({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        buttonVariants({ variant: "ghost", size: "lg" }),
        "h-10 w-full justify-start gap-3 rounded-xl border border-white/10 bg-white/5 px-3 text-sm font-semibold text-zinc-50 hover:bg-white/10",
      )}
    >
      <span className="text-yellow-100/90">{icon}</span>
      {label}
    </Link>
  );
}

function NavInner() {
  return (
    <div className="space-y-2">
      <NavLink
        href="/admin/dashboard"
        label="Дашборд"
        icon={<BarChart3 className="h-4 w-4" />}
      />
      <NavLink
        href="/admin/products"
        label="Товары (CRUD)"
        icon={<Table2 className="h-4 w-4" />}
      />
      <NavLink
        href="/admin/products/csv"
        label="CSV импорт/экспорт"
        icon={<Package className="h-4 w-4" />}
      />
      <NavLink
        href="/admin/pages"
        label="Страницы"
        icon={<FileText className="h-4 w-4" />}
      />
      <NavLink
        href="/admin/settings"
        label="Настройки сайта"
        icon={<Settings className="h-4 w-4" />}
      />
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between gap-3 lg:hidden">
        <div className="text-sm font-semibold text-zinc-50">Admin</div>
        <Sheet>
          <SheetTrigger className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-zinc-50 outline-none transition hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-yellow-400/30">
            <Menu className="h-5 w-5" />
          </SheetTrigger>
          <SheetContent side="left" className="border-white/10 bg-black/95 p-0">
            <SheetHeader className="p-4">
              <SheetTitle className="text-zinc-50">Навигация</SheetTitle>
            </SheetHeader>
            <Separator className="bg-white/10" />
            <div className="p-4">
              <NavInner />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="hidden lg:block">
          <Card className="border-white/10 bg-black/40">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-zinc-50">Admin</div>
                <div className="rounded-full border border-yellow-400/15 bg-yellow-400/8 px-2 py-1 text-[11px] font-semibold text-yellow-100/90">
                  Dark Admin
                </div>
              </div>

              <Separator className="my-4 bg-white/10" />

              <ScrollArea className="h-[calc(100vh-220px)] pr-2">
                <NavInner />
              </ScrollArea>

              <Separator className="my-4 bg-white/10" />

              <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-xs text-zinc-200/70">
                Демо-API пишет в файл <span className="font-mono">data/admin-db.json</span>.
                Для продакшена лучше Supabase/БД.
              </div>
            </CardContent>
          </Card>
        </aside>

        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}

