"use client";

import Link from "next/link";
import { Flame, Binoculars, Crosshair, Shield } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const TILES = [
  {
    href: "/catalog/thermal-scopes",
    title: "Теплоприцелы",
    icon: Flame,
  },
  {
    href: "/catalog/thermal-monoculars",
    title: "Тепломонокуляры",
    icon: Binoculars,
  },
  {
    href: "/catalog/optical-scopes",
    title: "Оптика",
    icon: Crosshair,
  },
  {
    href: "/warranty",
    title: "Гарантия",
    icon: Shield,
  },
] as const;

export function CategoryTiles() {
  return (
    <section className="mt-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {TILES.map((t) => {
          const Icon = t.icon;
          return (
            <Link
              key={t.href}
              href={t.href}
              className="group"
            >
              <Card className="relative overflow-hidden rounded-2xl border-white/10 bg-black/30 transition hover:bg-white/7">
                <div className="pointer-events-none absolute inset-0 opacity-70 [background-image:radial-gradient(circle_at_20%_0%,rgba(250,204,21,.10),transparent_45%),linear-gradient(to_bottom,rgba(255,255,255,.05),transparent_40%)]" />
                <CardContent className="relative p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl border border-yellow-400/15 bg-yellow-400/8 p-3 text-yellow-100/90 transition group-hover:bg-yellow-400/12">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="text-sm font-semibold text-zinc-50">{t.title}</div>
                  </div>
                  <div className="mt-3 text-xs font-semibold text-yellow-100/80">
                    Открыть →
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

