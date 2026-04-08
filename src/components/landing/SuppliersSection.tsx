import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";

const BRANDS = [
  { label: "Sytong", src: "/brands/sytong.png" },
  { label: "Vector Optics", src: "/brands/vector-optics.png" },
  { label: "SFH", src: "/brands/sfh.png" },
  { label: "Rika NV", src: "/brands/rika-nv.png" },
  { label: "Arkon", src: "/brands/arkon.png" },
] as const;

export function SuppliersSection() {
  return (
    <section className="mt-14">
      <h2 className="text-center text-base font-semibold text-zinc-50">
        Наши поставщики
      </h2>

      <Card className="mt-6 border-white/10 bg-white/5">
        <CardContent className="p-6">
          <div className="grid grid-cols-2 items-center gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {BRANDS.map((b) => (
              <div
                key={b.label}
                className="group flex h-16 items-center justify-center rounded-2xl border border-white/10 bg-white/95 px-3 shadow-sm transition hover:bg-white"
                title={b.label}
              >
                <div className="relative h-9 w-full max-w-[160px] opacity-95 transition group-hover:opacity-100">
                  <Image
                    src={b.src}
                    alt={b.label}
                    fill
                    className="object-contain"
                    sizes="140px"
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 text-center text-xs text-zinc-200/65">
            Официальные поставки и бренды. Линейки и наличие — в каталоге.
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

