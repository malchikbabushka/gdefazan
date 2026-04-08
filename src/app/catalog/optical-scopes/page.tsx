import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Оптические прицелы",
  description:
    "Оптические прицелы для охоты и спорта. Подбор по кратности и характеристикам — раздел в разработке.",
  alternates: { canonical: "/catalog/optical-scopes" },
  robots: { index: true, follow: true },
};

export default function OpticalScopesPage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">
          Оптические прицелы
        </h1>
        <p className="mt-2 text-sm text-zinc-200/75">
          Раздел-заглушка. Сюда можно подключить отдельный каталог/поставщиков или
          добавить товары в общую базу.
        </p>
        <div className="mt-6 rounded-2xl border border-yellow-400/15 bg-yellow-400/8 p-4 text-sm text-yellow-100/95">
          Совет: если хотите полноценную админку с товарами/брендами/страницами —
          лучше подключить CMS (например Payload/Strapi/Directus) или сделать свой
          бэкенд. В этой демо-версии редактирование меню/контактов сделано локально.
        </div>
      </div>
    </div>
  );
}

