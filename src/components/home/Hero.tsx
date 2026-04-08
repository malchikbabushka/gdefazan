type Props = {
  onOpenFilters: () => void;
  onApplyQuickFilter: (
    patch: Partial<{
      deviceTypes: Set<"scope" | "monocular">;
      matrices: Set<"384×288" | "640×512" | "1024×768" | "1280×1024">;
      lenses: Set<19 | 25 | 35 | 50>;
      rangefinderOnly: boolean;
    }>,
  ) => void;
};

export function Hero({ onOpenFilters, onApplyQuickFilter }: Props) {
  return (
    <header className="relative overflow-hidden rounded-2xl border border-yellow-400/15 bg-gradient-to-b from-yellow-400/10 via-black to-black p-6 sm:p-10">
      <div className="pointer-events-none absolute inset-0 opacity-60 [background-image:radial-gradient(circle_at_30%_20%,rgba(250,204,21,.18),transparent_45%),radial-gradient(circle_at_80%_10%,rgba(255,255,255,.08),transparent_40%),linear-gradient(to_bottom,rgba(255,255,255,.06),transparent_35%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-25 [background-image:linear-gradient(to_right,rgba(255,255,255,.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,.06)_1px,transparent_1px)] [background-size:28px_28px]" />
      <div className="pointer-events-none absolute -left-20 top-1/2 h-[460px] w-[460px] -translate-y-1/2 rounded-full border border-yellow-400/10 bg-yellow-400/5 blur-2xl" />

      <div className="relative flex flex-col gap-6">
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-yellow-400/20 bg-black/40 px-3 py-1 text-xs text-yellow-100/90">
          <span className="h-2 w-2 rounded-full bg-yellow-400 shadow-[0_0_0_3px_rgba(250,204,21,.15)]" />
          Каталог тепловизоров для охоты
        </div>

        <div className="flex flex-col gap-3">
          <h1 className="max-w-3xl text-balance text-3xl font-semibold tracking-tight text-zinc-50 sm:text-4xl lg:text-5xl">
            Тепловизионные прицелы и монокуляры
          </h1>
          <p className="max-w-2xl text-pretty text-sm leading-6 text-zinc-200/80 sm:text-base">
            Фильтруйте по цене, матрице, линзе, кратности и наличию дальномера. Темная
            подача в стиле “military” — строгая, функциональная, без лишнего.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <a
            href="#catalog"
            className="inline-flex h-11 items-center justify-center rounded-xl bg-yellow-400 px-5 text-sm font-medium text-black transition hover:bg-yellow-300 focus:outline-none focus:ring-2 focus:ring-yellow-300/60 focus:ring-offset-2 focus:ring-offset-black"
          >
            Перейти к товарам
          </a>
          <button
            type="button"
            className="inline-flex h-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 px-5 text-sm font-medium text-zinc-50 transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20 focus:ring-offset-2 focus:ring-offset-black"
            onClick={onOpenFilters}
          >
            Открыть фильтры
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            {
              k: "Тип",
              v: "Прицел / Монокуляр",
              onClick: () =>
                onApplyQuickFilter({
                  deviceTypes: new Set(["scope", "monocular"]),
                }),
            },
            {
              k: "Матрица",
              v: "640×512",
              onClick: () =>
                onApplyQuickFilter({
                  matrices: new Set(["640×512"]),
                }),
            },
            {
              k: "Линза",
              v: "50 мм",
              onClick: () =>
                onApplyQuickFilter({
                  lenses: new Set([50]),
                }),
            },
            {
              k: "Дальномер",
              v: "Только LRF",
              onClick: () =>
                onApplyQuickFilter({
                  rangefinderOnly: true,
                }),
            },
          ].map((x) => (
            <button
              key={x.k}
              type="button"
              className="rounded-xl border border-white/10 bg-black/40 px-3 py-3 text-left transition hover:bg-white/7 focus:outline-none focus:ring-2 focus:ring-yellow-400/30"
              onClick={x.onClick}
            >
              <div className="text-[11px] uppercase tracking-wide text-zinc-200/60">
                {x.k}
              </div>
              <div className="mt-1 text-sm font-semibold text-zinc-50">{x.v}</div>
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}

