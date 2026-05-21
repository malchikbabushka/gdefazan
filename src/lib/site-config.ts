export type MenuItem =
  | {
      id: string;
      label: string;
      href: string;
      children?: never;
    }
  | {
      id: string;
      label: string;
      href?: string;
      children: Array<{ id: string; label: string; href: string }>;
    };

export type SiteConfig = {
  storeName: string;
  phone: string;
  email: string;
  hours: string;
  logoText: string;
  menu: MenuItem[];
  /** Ordered product ids for the home page leaders section. */
  homeLeadersProductIds: string[];
};

export const DEFAULT_SITE_CONFIG: SiteConfig = {
  storeName: "ГДЕ ФАЗАН?!",
  logoText: "TH",
  phone: "+7 (999) 900-19-10",
  email: "info@gde-fazan.ru",
  hours: "Пн–Сб 10:00–19:00",
  homeLeadersProductIds: [],
  menu: [
    { id: "home", label: "Главная", href: "/" },
    { id: "thermal-scopes-top", label: "Теплоприцелы", href: "/catalog/thermal-scopes" },
    { id: "thermal-monoculars-top", label: "Монокуляры", href: "/catalog/thermal-monoculars" },
    { id: "accessories-top", label: "Аксессуары", href: "/catalog/accessories" },
    {
      id: "catalog",
      label: "Каталог",
      href: "/catalog",
      children: [
        {
          id: "thermal-scopes",
          label: "Тепловизионные прицелы",
          href: "/catalog/thermal-scopes",
        },
        {
          id: "thermal-monoculars",
          label: "Тепловизионные монокуляры",
          href: "/catalog/thermal-monoculars",
        },
        {
          id: "optical-scopes",
          label: "Оптические прицелы",
          href: "/catalog/optical-scopes",
        },
        { id: "accessories", label: "Аксессуары", href: "/catalog/accessories" },
        { id: "brands", label: "Бренды", href: "/brands" },
      ],
    },
    { id: "warranty", label: "Гарантия и возврат", href: "/warranty" },
    { id: "shipping", label: "Доставка и оплата", href: "/shipping-payment" },
    { id: "contacts", label: "Контакты", href: "/contacts" },
  ],
};

const STORAGE_KEY = "thermal-shop:site-config:v1";

export function loadSiteConfigFromStorage(): SiteConfig | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SiteConfig;
    if (!parsed || !Array.isArray(parsed.menu)) return null;

    // Merge: ensure new default menu items exist even if user saved old config.
    const existingIds = new Set(parsed.menu.map((m) => m.id));
    const additions = DEFAULT_SITE_CONFIG.menu.filter((m) => !existingIds.has(m.id));
    const mergedMenu = [...parsed.menu, ...additions];

    const leaders = Array.isArray((parsed as Partial<SiteConfig>).homeLeadersProductIds)
      ? ((parsed as Partial<SiteConfig>).homeLeadersProductIds as unknown[]).filter(
          (x): x is string => typeof x === "string" && x.trim().length > 0,
        )
      : DEFAULT_SITE_CONFIG.homeLeadersProductIds;

    // Backward compat: migrate old key if present.
    const legacy = Array.isArray((parsed as any).homeFeaturedProductIds)
      ? ((parsed as any).homeFeaturedProductIds as unknown[]).filter(
          (x: unknown): x is string => typeof x === "string" && x.trim().length > 0,
        )
      : [];

    return {
      ...parsed,
      menu: mergedMenu,
      homeLeadersProductIds: leaders.length ? leaders : legacy,
    };
  } catch {
    return null;
  }
}

export function saveSiteConfigToStorage(config: SiteConfig) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

