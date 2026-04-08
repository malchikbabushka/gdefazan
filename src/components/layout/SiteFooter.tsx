import Link from "next/link";
import { Separator } from "@/components/ui/separator";

const LINKS = [
  { href: "/catalog", label: "Каталог" },
  { href: "/brands", label: "Бренды" },
  { href: "/warranty", label: "Гарантия и возврат" },
  { href: "/shipping-payment", label: "Доставка и оплата" },
] as const;

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-white/10 bg-black/40">
      <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <div className="text-sm font-semibold tracking-wide text-zinc-50">
              ГДЕ ФАЗАН?!
            </div>
            <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-200/70">
              Премиальная витрина тепловизионных прицелов и монокуляров для охоты.
              Подбор по матрице, линзе и дальномеру, консультация и доставка по РФ.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-sm font-semibold text-zinc-100/85 transition hover:text-zinc-50"
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>

        <Separator className="my-8 bg-white/10" />

        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-300/60">
          <div>© {new Date().getFullYear()} «ГДЕ ФАЗАН?!»</div>
          <div className="text-zinc-300/50">
            Демо-версия. Интеграции и контент — в разработке.
          </div>
        </div>
      </div>
    </footer>
  );
}

