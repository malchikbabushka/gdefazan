"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

type Props = {
  images: string[];
  productName: string;
};

function isDataUrl(src: string) {
  return src.startsWith("data:");
}

export function ProductGallery({ images, productName }: Props) {
  const list = useMemo(() => images.filter(Boolean), [images]);
  const [active, setActive] = useState(0);

  const safeIndex = list.length ? Math.min(active, list.length - 1) : 0;
  const current = list[safeIndex];

  if (!list.length) {
    return (
      <div className="aspect-square w-full rounded-2xl border border-white/10 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,.10),transparent_55%),radial-gradient(circle_at_70%_70%,rgba(250,204,21,.12),transparent_55%),linear-gradient(to_bottom,rgba(255,255,255,.06),transparent)]" />
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-white/10 bg-black/40">
        {isDataUrl(current) ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={current}
            alt={productName}
            className="h-full w-full object-contain"
          />
        ) : (
          <Image
            src={current}
            alt={productName}
            fill
            className="object-contain"
            sizes="(min-width: 1024px) 50vw, 100vw"
            priority={safeIndex === 0}
          />
        )}
      </div>

      {list.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {list.map((src, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
              className={cn(
                "relative h-14 w-20 shrink-0 overflow-hidden rounded-xl border transition",
                i === safeIndex
                  ? "border-yellow-400/60 ring-2 ring-yellow-400/25"
                  : "border-white/10 hover:border-white/20",
              )}
              aria-label={`Фото ${i + 1}`}
            >
              {isDataUrl(src) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={src} alt="" className="h-full w-full object-cover" />
              ) : (
                <Image src={src} alt="" fill className="object-cover" sizes="80px" />
              )}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
