"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Clock3,
  Crosshair,
  Package,
  Mail,
  Menu,
  MountainSnow,
  Phone,
  Search,
  Shield,
  User,
} from "lucide-react";
import type { MenuItem, SiteConfig } from "@/lib/site-config";
import {
  DEFAULT_SITE_CONFIG,
  loadSiteConfigFromStorage,
} from "@/lib/site-config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { CartSheet } from "@/components/cart/CartSheet";
import { useProducts } from "@/lib/products-store";
import { topMatches } from "@/lib/search";
import { getProductUrl } from "@/lib/product-utils";

function MenuLink({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn("text-sm font-medium text-zinc-100/90 transition hover:text-zinc-50", className)}
    >
      {children}
    </Link>
  );
}

type MenuGroup = Extract<MenuItem, { children: any }>;

function isMenuGroup(item: MenuItem): item is MenuGroup {
  return "children" in item;
}

function CatalogDropdown({
  item,
  onNavigate,
}: {
  item: MenuGroup;
  onNavigate: (href: string) => void;
}) {
  const cards = useMemo(() => {
    const iconByLabel: Array<[RegExp, React.ComponentType<{ className?: string }>]> = [
      [/теплоприцел/i, MountainSnow],
      [/монокул/i, Crosshair],
      [/аксесс/i, Package],
    ];

    return item.children.map((c) => {
      const Icon =
        iconByLabel.find(([re]) => re.test(c.label))?.[1] ??
        MountainSnow;

      const description =
        /теплоприцел/i.test(c.label)
          ? "Тепловизионные прицелы: матрица, линза, дальномер"
          : /монокул/i.test(c.label)
            ? "Монокуляры: лёгкие, быстрые, для поиска"
            : /аксесс/i.test(c.label)
              ? "Крепления, батареи, чехлы и прочее"
              : "Раздел каталога";

      return { ...c, Icon, description };
    });
  }, [item.children]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="inline-flex h-10 items-center rounded-2xl px-3 text-sm font-semibold text-zinc-100/90 outline-none transition hover:bg-white/5 hover:text-zinc-50 focus-visible:ring-2 focus-visible:ring-yellow-400/30">
        {item.label}
        <span className="ml-1 text-zinc-300/60">▾</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-[560px] rounded-2xl border-white/10 bg-black/92 p-3 shadow-2xl"
      >
        <DropdownMenuGroup>
          <div className="flex items-center justify-between gap-3 px-2 py-2">
            <DropdownMenuLabel className="p-0 text-xs font-semibold uppercase tracking-wide text-zinc-200/65">
              Разделы каталога
            </DropdownMenuLabel>
            <button
              type="button"
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-zinc-50 transition hover:bg-white/10"
              onClick={() => onNavigate(item.href ?? "/catalog")}
            >
              Открыть каталог →
            </button>
          </div>

          <DropdownMenuSeparator className="my-2 bg-white/10" />

          <div className="grid grid-cols-2 gap-2">
            {cards.map((c) => (
              <DropdownMenuItem
                key={c.id}
                className="cursor-pointer rounded-2xl p-0 focus:bg-transparent"
                onClick={() => onNavigate(c.href)}
                onSelect={() => onNavigate(c.href)}
              >
                <div className="group w-full rounded-2xl border border-white/10 bg-white/4 px-4 py-3 transition hover:border-yellow-400/20 hover:bg-white/7">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-black/35">
                      <c.Icon className="h-5 w-5 text-yellow-100/90" />
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-zinc-50">
                        {c.label}
                      </div>
                      <div className="mt-1 line-clamp-2 text-xs leading-5 text-zinc-200/70">
                        {c.description}
                      </div>
                    </div>
                  </div>
                </div>
              </DropdownMenuItem>
            ))}

            <DropdownMenuItem
              className="cursor-pointer rounded-2xl p-0 focus:bg-transparent"
              onClick={() => onNavigate("/brands")}
              onSelect={() => onNavigate("/brands")}
            >
              <div className="group w-full rounded-2xl border border-white/10 bg-white/4 px-4 py-3 transition hover:border-yellow-400/20 hover:bg-white/7">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-black/35">
                    <Shield className="h-5 w-5 text-yellow-100/90" />
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-zinc-50">
                      Бренды
                    </div>
                    <div className="mt-1 line-clamp-2 text-xs leading-5 text-zinc-200/70">
                      Официальные поставщики и линейки
                    </div>
                  </div>
                </div>
              </div>
            </DropdownMenuItem>

            <DropdownMenuItem
              className="cursor-pointer rounded-2xl p-0 focus:bg-transparent"
              onClick={() => onNavigate("/shipping-payment")}
              onSelect={() => onNavigate("/shipping-payment")}
            >
              <div className="group w-full rounded-2xl border border-white/10 bg-white/4 px-4 py-3 transition hover:border-yellow-400/20 hover:bg-white/7">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-black/35">
                    <Package className="h-5 w-5 text-yellow-100/90" />
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-zinc-50">
                      Доставка и оплата
                    </div>
                    <div className="mt-1 line-clamp-2 text-xs leading-5 text-zinc-200/70">
                      Способы, сроки, документы
                    </div>
                  </div>
                </div>
              </div>
            </DropdownMenuItem>
          </div>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function SiteHeader() {
  const [config, setConfig] = useState<SiteConfig>(DEFAULT_SITE_CONFIG);
  const router = useRouter();
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [desktopSuggestOpen, setDesktopSuggestOpen] = useState(false);
  const blurCloseTimer = useRef<number | null>(null);
  const { products, adminProducts } = useProducts();

  const suggestions = useMemo(() => {
    const q = searchValue.trim();
    if (!q) return [];
    return topMatches(
      products,
      q,
      (p) => `${p.brand} ${p.name}`,
      8,
    ).map((h) => h.item);
  }, [products, searchValue]);

  const adminThumbByCatalogId = useMemo(() => {
    const map = new Map<string, string>();
    for (const a of adminProducts) {
      const thumb = a.photoDataUrls?.[0];
      if (!thumb) continue;
      if (a.linkedCatalogProductId) map.set(a.linkedCatalogProductId, thumb);
      // also allow matching by a_ prefix id if it was added from admin
      map.set(`a_${a.id}`, thumb);
    }
    return map;
  }, [adminProducts]);

  useEffect(() => {
    const fromStorage = loadSiteConfigFromStorage();
    if (fromStorage) setConfig(fromStorage);
  }, []);

  const menu = useMemo(() => config.menu, [config.menu]);

  useEffect(() => {
    setSearchOpen(false);
  }, [pathname]);

  function goSearch(q: string) {
    const query = q.trim();
    if (!query) return;
    router.push(`/catalog?q=${encodeURIComponent(query)}`);
  }

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-black/70 backdrop-blur">
      {/* top bar */}
      <div className="border-b border-white/10 bg-black/60">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-3 py-2 text-xs text-zinc-200/70">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-yellow-100/80" />
                <span className="font-semibold text-zinc-100/85">{config.phone}</span>
              </div>
              <div className="hidden items-center gap-2 sm:flex">
                <Mail className="h-4 w-4 text-yellow-100/80" />
                <span>{config.email}</span>
              </div>
              <div className="hidden items-center gap-2 md:flex">
                <Clock3 className="h-4 w-4 text-yellow-100/80" />
                <span>{config.hours}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/admin"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "hidden h-9 rounded-2xl border-yellow-400/15 bg-yellow-400/8 px-3 text-xs font-semibold text-yellow-100/95 hover:bg-yellow-400/12 md:inline-flex",
                )}
              >
                <Shield className="mr-2 h-4 w-4" />
                Админка
              </Link>
              <Button
                variant="outline"
                className="h-9 rounded-2xl border-white/10 bg-white/5 px-3 text-xs font-semibold text-zinc-50 hover:bg-white/10"
              >
                <User className="mr-2 h-4 w-4 text-yellow-100/80" />
                Вход
              </Button>
              <CartSheet />
            </div>
          </div>
        </div>
      </div>

      {/* main bar */}
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-3 py-3">
          <div className="flex items-center gap-2">
            <Sheet>
              <SheetTrigger
                aria-label="Открыть меню"
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-zinc-50 outline-none transition hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-yellow-400/30 lg:hidden"
              >
                <Menu className="h-5 w-5" />
              </SheetTrigger>
              <SheetContent side="left" className="w-[320px] border-white/10 bg-black/95">
                <SheetHeader>
                  <SheetTitle className="text-zinc-50">{config.storeName}</SheetTitle>
                </SheetHeader>
                <div className="mt-4 space-y-2">
                  {menu.map((item) => {
                    if (isMenuGroup(item)) {
                      return (
                        <div key={item.id} className="rounded-2xl border border-white/10 bg-white/5">
                          <div className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-200/70">
                            {item.label}
                          </div>
                          <Separator className="bg-white/10" />
                          <div className="p-2">
                            {item.children.map((c) => (
                              <Link
                                key={c.id}
                                href={c.href}
                                className={cn(
                                  buttonVariants({ variant: "ghost" }),
                                  "h-10 w-full justify-start rounded-xl text-zinc-50 hover:bg-white/7",
                                )}
                              >
                                {c.label}
                              </Link>
                            ))}
                          </div>
                        </div>
                      );
                    }
                    return (
                      <Link
                        key={item.id}
                        href={item.href}
                        className={cn(
                          buttonVariants({ variant: "ghost" }),
                          "h-10 w-full justify-start rounded-xl text-zinc-50 hover:bg-white/7",
                        )}
                      >
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              </SheetContent>
            </Sheet>

            <Link href="/" className="flex items-center gap-3">
              <div className="relative h-10 w-16 overflow-hidden rounded-xl border border-white/10 bg-white/90">
                <Image
                  src="/logo.png"
                  alt={config.storeName}
                  fill
                  className="object-contain p-1.5"
                  priority
                />
              </div>
              <div className="hidden leading-tight sm:block">
                <div className="text-sm font-semibold tracking-wide text-zinc-50">
                  {config.storeName}
                </div>
                <div className="text-[11px] text-zinc-300/70">
                  Тепловизоры • Оптика • Аксессуары
                </div>
              </div>
            </Link>
          </div>

          <div className="flex flex-1 items-center justify-end gap-2">
            <div className="hidden w-full max-w-xl lg:block">
              <form
                className="relative"
                onSubmit={(e) => {
                  e.preventDefault();
                  goSearch(searchValue);
                }}
              >
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-300/60" />
                <Input
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  onFocus={() => {
                    if (blurCloseTimer.current) window.clearTimeout(blurCloseTimer.current);
                    setDesktopSuggestOpen(true);
                  }}
                  onBlur={() => {
                    // delay: allow clicking suggestion
                    blurCloseTimer.current = window.setTimeout(
                      () => setDesktopSuggestOpen(false),
                      120,
                    );
                  }}
                  placeholder="Поиск по каталогу…"
                  className="h-11 rounded-2xl border-white/10 bg-black/40 pl-9 pr-24 text-zinc-50 placeholder:text-zinc-400 focus-visible:ring-yellow-400/30"
                />
                <Button
                  type="submit"
                  className="absolute right-1 top-1 h-9 rounded-2xl bg-yellow-400 px-4 text-sm font-semibold text-black hover:bg-yellow-300"
                >
                  Найти
                </Button>

                {desktopSuggestOpen && searchValue.trim() ? (
                  <div className="absolute left-0 right-0 top-[calc(100%+10px)] z-50 overflow-hidden rounded-2xl border border-white/10 bg-black/95 shadow-2xl">
                    <div className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-200/60">
                      Подходящие приборы
                    </div>
                    <Separator className="bg-white/10" />
                    <div className="max-h-[360px] overflow-auto p-2">
                      {suggestions.length ? (
                        <div className="space-y-1">
                          {suggestions.map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              className="flex w-full items-center justify-between gap-4 rounded-xl px-3 py-2 text-left text-sm text-zinc-50 transition hover:bg-white/7"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => router.push(getProductUrl(p))}
                            >
                              <div className="flex min-w-0 items-center gap-3">
                                <div className="relative h-10 w-14 overflow-hidden rounded-xl border border-white/10 bg-white/5">
                                  {adminThumbByCatalogId.get(p.id) ? (
                                    adminThumbByCatalogId.get(p.id)!.startsWith("data:") ? (
                                      // eslint-disable-next-line @next/next/no-img-element
                                      <img
                                        src={adminThumbByCatalogId.get(p.id)!}
                                        alt=""
                                        className="h-full w-full object-cover"
                                      />
                                    ) : (
                                      <Image
                                        src={adminThumbByCatalogId.get(p.id)!}
                                        alt=""
                                        fill
                                        className="object-cover"
                                        sizes="56px"
                                      />
                                    )
                                  ) : null}
                                </div>

                                <div className="min-w-0">
                                  <div className="truncate font-semibold">
                                    {p.brand} {p.name}
                                  </div>
                                  <div className="truncate text-xs text-zinc-300/70">
                                    {p.type === "scope" ? "Теплоприцел" : "Тепломонокуляр"} •{" "}
                                    {p.matrix} • {p.lensMm} мм
                                  </div>
                                </div>
                              </div>
                              <span className="text-xs text-zinc-300/70">↵</span>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="px-3 py-8 text-center text-sm text-zinc-200/70">
                          Ничего не найдено
                        </div>
                      )}
                      <div className="mt-2">
                        <button
                          type="button"
                          className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-zinc-50 transition hover:bg-white/10"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => goSearch(searchValue)}
                        >
                          Искать в каталоге:{" "}
                          <span className="font-mono">{searchValue.trim()}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : null}
              </form>
            </div>

            <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
              <DialogTrigger className="inline-flex h-11 items-center rounded-2xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-zinc-50 outline-none transition hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-yellow-400/30 lg:hidden">
                <Search className="mr-2 h-4 w-4 text-yellow-100/80" />
                Поиск
              </DialogTrigger>
              <DialogContent className="border-white/10 bg-black/95 p-0 sm:max-w-2xl">
                <DialogTitle className="sr-only">Поиск по каталогу</DialogTitle>
                <Command className="rounded-2xl bg-transparent">
                  <CommandInput
                    placeholder="Введите модель, бренд или характеристику…"
                    value={searchValue}
                    onValueChange={setSearchValue}
                  />
                  <CommandList>
                    <CommandEmpty>Ничего не найдено. Попробуйте другой запрос.</CommandEmpty>
                    {suggestions.length > 0 ? (
                      <CommandGroup heading="Товары">
                        {suggestions.map((p) => (
                          <CommandItem
                            key={p.id}
                            onSelect={() => router.push(getProductUrl(p))}
                          >
                            <span className="font-semibold text-zinc-50">
                              {p.brand}
                            </span>
                            <span className="ml-2 text-zinc-200/80">
                              {p.name}
                            </span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    ) : null}
                    <CommandGroup heading="Действия">
                      <CommandItem
                        onSelect={() => {
                          goSearch(searchValue);
                        }}
                      >
                        Искать: <span className="ml-2 font-semibold text-zinc-50">{searchValue || "…"}</span>
                      </CommandItem>
                      <CommandItem onSelect={() => router.push("/catalog")}>
                        Открыть каталог
                      </CommandItem>
                    </CommandGroup>
                  </CommandList>
                </Command>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* bottom nav */}
        <div className="hidden items-center gap-2 pb-3 lg:flex">
          {menu.map((item) => {
            if (isMenuGroup(item))
              return (
                <CatalogDropdown
                  key={item.id}
                  item={item}
                  onNavigate={(href) => router.push(href)}
                />
              );
            return (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  buttonVariants({ variant: "ghost", size: "lg" }),
                  "h-10 rounded-2xl px-3 text-sm font-semibold text-zinc-100/90 hover:bg-white/5 hover:text-zinc-50",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
}

