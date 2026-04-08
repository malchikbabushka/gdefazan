import type { Product } from "@/lib/catalog-types";
import { formatRub } from "@/lib/catalog-logic";
import { getProductUrl } from "@/lib/product-utils";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useProducts } from "@/lib/products-store";
import { useCart } from "@/lib/cart-store";

type Props = {
  product: Product;
};

export function ProductCard({ product }: Props) {
  const { products, adminProducts } = useProducts();
  const cart = useCart(products);

  const images = useMemo(() => {
    const out: string[] = [];
    for (const a of adminProducts) {
      const list = Array.isArray(a.photoDataUrls) ? a.photoDataUrls : [];
      if (list.length === 0) continue;
      if (a.linkedCatalogProductId && a.linkedCatalogProductId === product.id) {
        out.push(...list);
        break;
      }
      if (`a_${a.id}` === product.id) {
        out.push(...list);
        break;
      }
    }
    return out.filter(Boolean);
  }, [adminProducts, product.id]);

  const [activeImg, setActiveImg] = useState(0);
  const hoverTimer = useRef<number | null>(null);

  useEffect(() => {
    // Reset when product changes / images updated
    setActiveImg(0);
  }, [product.id, images.length]);

  function startHoverCycle() {
    if (images.length <= 1) return;
    if (hoverTimer.current) window.clearInterval(hoverTimer.current);
    hoverTimer.current = window.setInterval(() => {
      setActiveImg((x) => (x + 1) % images.length);
    }, 1800);
  }

  function stopHoverCycle() {
    if (hoverTimer.current) window.clearInterval(hoverTimer.current);
    hoverTimer.current = null;
    setActiveImg(0);
  }

  useEffect(() => {
    return () => {
      if (hoverTimer.current) window.clearInterval(hoverTimer.current);
    };
  }, []);

  const current = images[activeImg] ?? null;

  return (
    <Link href={getProductUrl(product)} className="block focus:outline-none">
      <Card className="group relative overflow-hidden rounded-2xl border-white/10 bg-gradient-to-b from-white/5 to-black transition hover:border-yellow-400/20 hover:bg-white/6">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[11px] uppercase tracking-wide text-zinc-200/60">
                {product.type === "scope" ? "Прицел" : "Монокуляр"} • {product.brand}
              </div>
              <h3 className="mt-1 truncate text-sm font-semibold text-zinc-50">
                {product.name}
              </h3>
            </div>
            <Badge className="border border-white/10 bg-black/50 text-zinc-200/80 hover:bg-black/50">
              {product.matrix} • {product.lensMm} мм
            </Badge>
          </div>

          <div className="relative mt-3 aspect-[4/3] w-full overflow-hidden rounded-xl border border-white/10 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,.10),transparent_55%),radial-gradient(circle_at_70%_70%,rgba(250,204,21,.12),transparent_55%),linear-gradient(to_bottom,rgba(255,255,255,.06),transparent)]">
            {current ? (
              <div
                className="absolute inset-0 flex transition-transform duration-1000 ease-out motion-reduce:transition-none"
                style={{ transform: `translateX(-${activeImg * 100}%)` }}
              >
                {images.map((src, idx) => (
                  <div key={`${product.id}-${idx}`} className="relative h-full w-full flex-none">
                    {src.startsWith("data:") ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={src} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <Image
                        src={src}
                        alt={product.name}
                        fill
                        className="object-cover"
                        sizes="320px"
                        priority={idx === 0}
                      />
                    )}
                  </div>
                ))}
              </div>
            ) : null}

            <div
              className="absolute inset-0 z-10"
              onMouseEnter={startHoverCycle}
              onMouseLeave={stopHoverCycle}
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent opacity-70" />

            {images.length > 1 ? (
              <div className="pointer-events-none absolute bottom-2 left-2 right-2 flex items-center gap-1.5">
                {images.slice(0, 6).map((_, i) => (
                  <span
                    key={i}
                    className={
                      "h-1 w-4 rounded-full " +
                      (i === activeImg ? "bg-yellow-400/90" : "bg-white/25")
                    }
                    aria-hidden="true"
                  />
                ))}
              </div>
            ) : null}
          </div>

          <div className="mt-4 flex items-start justify-between gap-3">
            <p className="text-xs text-zinc-200/70">
              {product.magnificationMin}–{product.magnificationMax}× • дальномер:{" "}
              {product.hasRangefinder ? "да" : "нет"}
            </p>
            <div className="text-right">
              <div className="text-sm font-semibold text-yellow-100/90">
                {formatRub(product.priceRub)}
              </div>
              <div className="mt-1 text-[11px] text-zinc-300/70">
                {product.inStock ? "в наличии" : "под заказ"}
              </div>
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <Button
              className="h-10 flex-1 rounded-xl bg-yellow-400 text-sm font-semibold text-black hover:bg-yellow-300"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                cart.add(product.id, 1);
              }}
            >
              В корзину
            </Button>
            <Button
              variant="outline"
              className="h-10 rounded-xl border-white/10 bg-white/5 px-3 text-sm font-semibold text-zinc-50 hover:bg-white/10"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              Сравнить
            </Button>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

