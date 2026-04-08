"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronsLeft, ChevronsRight } from "lucide-react";

type Slide = {
  id: string;
  title: string;
  subtitle: string;
  badge?: string;
  imageSrc?: string;
  imageAlt?: string;
};

const SLIDES: Slide[] = [
  {
    id: "s1",
    title: "Sytong MM06-50LRF",
    subtitle: "Специальные цены на топовые модели",
    badge: "Хит сезона",
    imageSrc: "/hero/slide-1.png",
    imageAlt: "Тепловизионный прицел в горах",
  },
  {
    id: "s2",
    title: "Подбор под вашу охоту",
    subtitle: "Матрица, линза, кратность и дальномер — без ошибок",
    badge: "Консультация",
    imageSrc: "/hero/slide-2.png",
    imageAlt: "Тепловизионный прицел в поле",
  },
  {
    id: "s3",
    title: "Проверка и гарантия",
    subtitle: "Официальные поставки, поддержка и сервис",
    badge: "Надёжно",
    imageSrc: "/hero/slide-1.png",
    imageAlt: "Тепловизионный прицел в горах",
  },
];

export function LandingHero() {
  const [active, setActive] = useState(0);

  // Autoplay disabled: manual navigation only.

  return (
    <section className="relative">
      <div className="relative isolate overflow-hidden bg-[#0b0f0d]">
        <div
          className="flex w-full transition-transform duration-700 ease-out motion-reduce:transition-none"
          style={{ transform: `translateX(-${active * 100}%)` }}
        >
          {SLIDES.map((slide, idx) => (
            <div
              key={slide.id}
              className="relative w-full flex-none"
              aria-hidden={idx !== active}
            >
              {slide.imageSrc ? (
                <div className="absolute inset-0">
                  <Image
                    src={slide.imageSrc}
                    alt={slide.imageAlt ?? slide.title}
                    fill
                    priority={idx === 0}
                    className="object-cover opacity-90"
                    sizes="100vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/15" />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-transparent to-black/65" />
                  {/* Extra top-left vignette for header readability */}
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_14%,rgba(0,0,0,.72),transparent_52%)]" />
                  <div className="absolute inset-0 bg-gradient-to-br from-black/45 via-transparent to-transparent" />
                </div>
              ) : null}

              <div className="absolute inset-0 opacity-70 [background-image:radial-gradient(circle_at_15%_15%,rgba(250,204,21,.16),transparent_45%),radial-gradient(circle_at_85%_20%,rgba(255,255,255,.08),transparent_40%),linear-gradient(to_bottom,rgba(255,255,255,.05),transparent_40%)]" />
              <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(to_right,rgba(255,255,255,.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,.06)_1px,transparent_1px)] [background-size:32px_32px]" />

              {/* Diagonal geometry (premium feel) */}
              <div className="pointer-events-none absolute inset-0">
                <div className="absolute -right-24 -top-24 h-72 w-[520px] rotate-12 bg-[linear-gradient(135deg,rgba(250,204,21,.18),transparent_45%)] blur-[1px]" />
                <div className="absolute -left-40 bottom-[-140px] h-72 w-[720px] -rotate-12 bg-[repeating-linear-gradient(135deg,rgba(255,255,255,.10)_0,rgba(255,255,255,.10)_2px,transparent_2px,transparent_14px)] opacity-35" />
                {/* Black skew corner block (as in reference sketch) */}
                <div className="absolute -bottom-20 -right-20 h-[240px] w-[400px] -skew-x-12 bg-black/78 shadow-[0_0_0_1px_rgba(255,255,255,.06)]" />
                <div className="absolute -bottom-20 -right-20 h-[240px] w-[400px] -skew-x-12 bg-[repeating-linear-gradient(135deg,rgba(255,255,255,.10)_0,rgba(255,255,255,.10)_2px,transparent_2px,transparent_16px)] opacity-14" />
              </div>

              <div className="relative mx-auto flex min-h-[480px] w-full max-w-6xl flex-col justify-end gap-6 px-4 pb-10 pt-10 sm:min-h-[540px] sm:px-6 sm:pb-12 lg:min-h-[580px] lg:px-8 lg:pb-14">
                <div className="max-w-2xl">
                  {slide.badge ? (
                    <Badge className="border border-yellow-400/20 bg-yellow-400/10 text-yellow-100/90 hover:bg-yellow-400/12">
                      {slide.badge}
                    </Badge>
                  ) : null}
                  <h1 className="mt-4 text-balance text-4xl font-semibold tracking-tight text-zinc-50 sm:text-5xl">
                    {slide.title}
                  </h1>
                  <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-200/75 sm:text-base">
                    {slide.subtitle}
                  </p>

                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    <Link href="/catalog/thermal-scopes">
                      <Button className="h-11 rounded-2xl bg-yellow-400 px-6 text-sm font-semibold text-black hover:bg-yellow-300">
                        В каталог теплоприцелов
                      </Button>
                    </Link>
                    <Link href="/catalog/thermal-monoculars">
                      <Button
                        variant="outline"
                        className="h-11 rounded-2xl border-white/10 bg-white/5 px-6 text-sm font-semibold text-zinc-50 hover:bg-white/10"
                      >
                        Тепломонокуляры
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* Minimal controls: dots + icon buttons (no strip, no labels) */}
                <div className="absolute bottom-5 left-4 right-4 grid grid-cols-3 items-center gap-3 sm:left-6 sm:right-6 lg:left-8 lg:right-8">
                  <div />

                  <div className="mx-auto flex items-center justify-center gap-2">
                    {SLIDES.map((_, dotIdx) => (
                      <button
                        key={dotIdx}
                        type="button"
                        className={cn(
                          "h-1.5 w-1.5 rounded-full transition hover:bg-white/25",
                          dotIdx === active ? "bg-yellow-400/70" : "bg-white/15",
                        )}
                        onClick={() => setActive(dotIdx)}
                        aria-label={`Перейти к слайду ${dotIdx + 1}`}
                      />
                    ))}
                  </div>

                  <div className="ml-auto" />
                </div>
              </div>

              {/* Right navigation block (positioned to viewport corner) */}
              <div className="pointer-events-none absolute bottom-6 right-4 z-30 sm:bottom-7 sm:right-6 lg:bottom-8 lg:right-10">
                <div className="pointer-events-auto inline-flex overflow-hidden rounded-2xl border border-white/10 bg-black/40 shadow-[0_16px_50px_rgba(0,0,0,.62)] backdrop-blur">
                  <button
                    type="button"
                    className="inline-flex h-20 w-20 items-center justify-center text-zinc-50 transition hover:bg-white/10 sm:h-24 sm:w-24"
                    onClick={() =>
                      setActive((x) => (x - 1 + SLIDES.length) % SLIDES.length)
                    }
                    aria-label="Предыдущий слайд"
                    title="Назад"
                  >
                    <ChevronsLeft className="h-9 w-9 text-yellow-100/90 sm:h-11 sm:w-11" />
                  </button>
                  <div className="w-px bg-white/10" />
                  <button
                    type="button"
                    className="inline-flex h-20 w-20 items-center justify-center text-zinc-50 transition hover:bg-white/10 sm:h-24 sm:w-24"
                    onClick={() => setActive((x) => (x + 1) % SLIDES.length)}
                    aria-label="Следующий слайд"
                    title="Вперёд"
                  >
                    <ChevronsRight className="h-9 w-9 text-yellow-100/90 sm:h-11 sm:w-11" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

