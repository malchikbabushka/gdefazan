"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

type Props = {
  images: string[];
  productName: string;
  /** When set, load photos via API (keeps HTML small; supports base64 stored server-side). */
  remoteAdminId?: string | null;
  remotePhotoCount?: number;
};

function isDataUrl(src: string) {
  return src.startsWith("data:");
}

function useNativeImg(src: string) {
  return isDataUrl(src) || src.startsWith("/api/");
}

export function ProductGallery({
  images,
  productName,
  remoteAdminId,
  remotePhotoCount,
}: Props) {
  const list = useMemo(() => {
    const n =
      typeof remotePhotoCount === "number" && remotePhotoCount > 0
        ? remotePhotoCount
        : 0;
    if (remoteAdminId && n > 0) {
      return Array.from(
        { length: Math.min(n, 12) },
        (_, i) => `/api/admin/products/${remoteAdminId}/photo?index=${i}`,
      );
    }
    return images.filter(Boolean);
  }, [images, remoteAdminId, remotePhotoCount]);
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
        {useNativeImg(current) ? (
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
              {useNativeImg(src) ? (
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
