import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const POINTS = [
  {
    k: "Подбор без ошибок",
    v: "Помогаем выбрать матрицу, линзу и кратность под дистанции и условия охоты.",
  },
  {
    k: "Проверка перед отправкой",
    v: "Демо-логика: в будущем — чек-лист, фото/видео и комплектация под заказ.",
  },
  {
    k: "Гарантия и сервис",
    v: "Официальные поставки и поддержка. Условия — на странице «Гарантия и возврат».",
  },
] as const;

export function AboutSection() {
  return (
    <section className="mt-14">
      <div className="mx-auto max-w-3xl text-center">
        <Badge className="bg-yellow-400 text-black hover:bg-yellow-300">О компании</Badge>
        <h2 className="mt-4 text-balance text-2xl font-semibold tracking-tight text-zinc-50 sm:text-3xl">
          Премиальная витрина тепловизионной оптики
        </h2>
        <p className="mt-3 text-sm leading-6 text-zinc-200/70 sm:text-base">
          «ГДЕ ФАЗАН?!» — магазин, где всё заточено под охоту: понятные фильтры,
          честные характеристики и быстрый подбор.
        </p>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {POINTS.map((p) => (
          <Card key={p.k} className="border-white/10 bg-white/5">
            <CardContent className="p-5">
              <div className="text-sm font-semibold text-zinc-50">{p.k}</div>
              <div className="mt-2 text-sm leading-6 text-zinc-200/70">{p.v}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

