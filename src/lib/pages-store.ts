export type PageContent = {
  title: string;
  body: string;
};

export type PageKey =
  | "warranty"
  | "shipping-payment"
  | "brands"
  | "catalog"
  | "home";

export const DEFAULT_PAGES: Record<PageKey, PageContent> = {
  home: {
    title: "Главная",
    body: "Главная страница формируется блоками (слайдер, лидеры продаж, поставщики).",
  },
  catalog: {
    title: "Каталог",
    body: "Каталог с фильтрами и сортировкой.",
  },
  warranty: {
    title: "Гарантия и возврат",
    body:
      "Эта страница — шаблон.\n\n" +
      "Здесь обычно размещают условия гарантии, возврата/обмена, сроки и порядок обращения в сервис.\n\n" +
      "- Гарантийные сроки по брендам\n" +
      "- Условия возврата и обмена\n" +
      "- Контакты сервисного отдела",
  },
  "shipping-payment": {
    title: "Доставка и оплата",
    body:
      "Эта страница — шаблон.\n\n" +
      "- Доставка курьером / транспортной компанией\n" +
      "- Самовывоз\n" +
      "- Оплата картой / счёт / наличные",
  },
  brands: {
    title: "Бренды",
    body: "Демо-страница брендов. Можно расширить описания, логотипы и фильтры.",
  },
};

const STORAGE_KEY = "thermal-shop:pages:v1";

export function loadPagesFromStorage(): Partial<Record<PageKey, PageContent>> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Partial<Record<PageKey, PageContent>>;
  } catch {
    return null;
  }
}

export function savePagesToStorage(pages: Partial<Record<PageKey, PageContent>>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(pages));
}

export function getPageContent(
  key: PageKey,
  stored: Partial<Record<PageKey, PageContent>> | null,
) {
  return stored?.[key] ?? DEFAULT_PAGES[key];
}

