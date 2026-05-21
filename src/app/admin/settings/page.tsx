"use client";

import { useEffect, useMemo, useState } from "react";
import type { SiteConfig } from "@/lib/site-config";
import {
  DEFAULT_SITE_CONFIG,
  loadSiteConfigFromStorage,
  saveSiteConfigToStorage,
} from "@/lib/site-config";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { useAppProducts } from "@/components/providers/AppProviders";

function safeParseJson<T>(
  raw: string,
): { ok: true; value: T } | { ok: false; error: string } {
  try {
    return { ok: true, value: JSON.parse(raw) as T };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "JSON parse error" };
  }
}

export default function AdminSettingsPage() {
  const { products } = useAppProducts();
  const [config, setConfig] = useState<SiteConfig>(DEFAULT_SITE_CONFIG);
  const [menuJson, setMenuJson] = useState("");
  const [leadersQuery, setLeadersQuery] = useState("");
  const [status, setStatus] = useState<{
    kind: "idle" | "ok" | "error";
    text?: string;
  }>({ kind: "idle" });

  useEffect(() => {
    const fromStorage = loadSiteConfigFromStorage();
    const initial = fromStorage ?? DEFAULT_SITE_CONFIG;
    setConfig(initial);
    setMenuJson(JSON.stringify(initial.menu, null, 2));

    fetch("/api/admin/site-config", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.persisted && data.config) {
          setConfig(data.config as SiteConfig);
          setMenuJson(JSON.stringify((data.config as SiteConfig).menu, null, 2));
        }
      })
      .catch(() => {});
  }, []);

  const canSave = useMemo(() => menuJson.trim().length > 0, [menuJson]);
  const leaders = useMemo(
    () => (Array.isArray(config.homeLeadersProductIds) ? config.homeLeadersProductIds : []),
    [config.homeLeadersProductIds],
  );
  const leadersSet = useMemo(() => new Set(leaders), [leaders]);
  const filteredProducts = useMemo(() => {
    const q = leadersQuery.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q),
    );
  }, [leadersQuery, products]);

  return (
    <Card className="border-white/10 bg-white/5">
      <CardHeader className="space-y-2">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <CardTitle className="text-2xl font-semibold tracking-tight text-zinc-50">
              Настройки сайта
            </CardTitle>
            <p className="mt-2 text-sm text-zinc-200/75">
              Меню и контакты: при Supabase сохраняются в Postgres; иначе — в localStorage.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            className="h-10 rounded-xl border-white/10 bg-white/5 px-4 text-sm font-semibold text-zinc-50 hover:bg-white/10"
            onClick={() => {
              setConfig(DEFAULT_SITE_CONFIG);
              setMenuJson(JSON.stringify(DEFAULT_SITE_CONFIG.menu, null, 2));
              saveSiteConfigToStorage(DEFAULT_SITE_CONFIG);
              setStatus({ kind: "ok", text: "Сброшено к настройкам по умолчанию." });
            }}
          >
            Сбросить
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-6 pt-0">
      <div className="mt-2 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-zinc-200/90">
              Название магазина
            </label>
            <Input
              className="mt-2 h-10 rounded-xl border-white/10 bg-black/40 text-zinc-50 placeholder:text-zinc-400"
              value={config.storeName}
              onChange={(e) => setConfig({ ...config, storeName: e.currentTarget.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-zinc-200/90">
                Логотип (текст)
              </label>
              <Input
                className="mt-2 h-10 rounded-xl border-white/10 bg-black/40 text-zinc-50 placeholder:text-zinc-400"
                value={config.logoText}
                onChange={(e) => setConfig({ ...config, logoText: e.currentTarget.value })}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-200/90">
                Часы работы
              </label>
              <Input
                className="mt-2 h-10 rounded-xl border-white/10 bg-black/40 text-zinc-50 placeholder:text-zinc-400"
                value={config.hours}
                onChange={(e) => setConfig({ ...config, hours: e.currentTarget.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-zinc-200/90">
                Телефон
              </label>
              <Input
                className="mt-2 h-10 rounded-xl border-white/10 bg-black/40 text-zinc-50 placeholder:text-zinc-400"
                value={config.phone}
                onChange={(e) => setConfig({ ...config, phone: e.currentTarget.value })}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-200/90">
                Email
              </label>
              <Input
                className="mt-2 h-10 rounded-xl border-white/10 bg-black/40 text-zinc-50 placeholder:text-zinc-400"
                value={config.email}
                onChange={(e) => setConfig({ ...config, email: e.currentTarget.value })}
              />
            </div>
          </div>

          <Separator className="bg-white/10" />

          <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
            <div className="text-sm font-semibold text-zinc-50">Лидеры продаж (главная)</div>
            <div className="mt-1 text-xs text-zinc-300/70">
              Выберите товары и порядок — именно они будут показаны на главной в секции «ЛИДЕРЫ ПРОДАЖ».
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Input
                placeholder="Поиск по товарам…"
                value={leadersQuery}
                onChange={(e) => setLeadersQuery(e.currentTarget.value)}
                className="h-9 w-full rounded-xl border-white/10 bg-black/40 text-xs text-zinc-50 sm:max-w-[320px]"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 rounded-xl border-white/10 bg-white/5 text-xs text-zinc-50"
                onClick={() => setConfig({ ...config, homeLeadersProductIds: [] })}
              >
                Снять все
              </Button>
            </div>
            <div className="mt-3 grid grid-cols-1 gap-2">
              {filteredProducts.map((p) => (
                <label
                  key={p.id}
                  className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-zinc-100/85 hover:bg-white/5"
                >
                  <Checkbox
                    checked={leadersSet.has(p.id)}
                    onCheckedChange={(c) => {
                      const next = [...leaders];
                      const idx = next.indexOf(p.id);
                      if (c === true) {
                        if (idx === -1) next.push(p.id);
                      } else {
                        if (idx !== -1) next.splice(idx, 1);
                      }
                      setConfig({ ...config, homeLeadersProductIds: next });
                    }}
                    className="data-[state=checked]:border-yellow-400 data-[state=checked]:bg-yellow-400 data-[state=checked]:text-black"
                  />
                  <span className="w-10 shrink-0 text-xs text-zinc-400">
                    {leaders.indexOf(p.id) === -1 ? "—" : leaders.indexOf(p.id) + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{p.brand} {p.name}</span>
                  {leadersSet.has(p.id) ? (
                    <div className="flex shrink-0 items-center gap-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 rounded-lg border-white/10 bg-white/5 px-2 text-xs"
                        disabled={leaders.indexOf(p.id) <= 0}
                        onClick={(e) => {
                          e.preventDefault();
                          const next = [...leaders];
                          const i = next.indexOf(p.id);
                          if (i > 0) [next[i - 1], next[i]] = [next[i], next[i - 1]];
                          setConfig({ ...config, homeLeadersProductIds: next });
                        }}
                      >
                        ↑
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 rounded-lg border-white/10 bg-white/5 px-2 text-xs"
                        disabled={leaders.indexOf(p.id) === -1 || leaders.indexOf(p.id) >= leaders.length - 1}
                        onClick={(e) => {
                          e.preventDefault();
                          const next = [...leaders];
                          const i = next.indexOf(p.id);
                          if (i !== -1 && i < next.length - 1) [next[i], next[i + 1]] = [next[i + 1], next[i]];
                          setConfig({ ...config, homeLeadersProductIds: next });
                        }}
                      >
                        ↓
                      </Button>
                    </div>
                  ) : null}
                </label>
              ))}
            </div>
            <div className="mt-2 text-[11px] text-zinc-400">
              Показано: {filteredProducts.length} • Выбрано: {leaders.length}
            </div>
          </div>

          <div className="pt-2">
            <Button
              type="button"
              disabled={!canSave}
              className="h-10 w-full rounded-xl bg-yellow-400 text-sm font-semibold text-black hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
              onClick={async () => {
                const parsed = safeParseJson<SiteConfig["menu"]>(menuJson);
                if (!parsed.ok) {
                  setStatus({ kind: "error", text: `Ошибка JSON: ${parsed.error}` });
                  return;
                }
                const next: SiteConfig = { ...config, menu: parsed.value };
                setConfig(next);
                saveSiteConfigToStorage(next);
                const put = await fetch("/api/admin/site-config", {
                  method: "PUT",
                  credentials: "include",
                  headers: { "content-type": "application/json" },
                  body: JSON.stringify({ config: next }),
                });
                const body = (await put.json().catch(() => ({}))) as { error?: string };
                if (put.ok) {
                  setStatus({ kind: "ok", text: "Сохранено в браузере и на сервере." });
                } else {
                  setStatus({
                    kind: "ok",
                    text: `Сохранено в браузере. Сервер: ${body.error ?? "не настроен (нужен Supabase)."}`,
                  });
                }
              }}
            >
              Сохранить
            </Button>
            {status.kind !== "idle" ? (
              <div
                className={
                  "mt-3 rounded-xl border p-3 text-sm " +
                  (status.kind === "ok"
                    ? "border-yellow-400/20 bg-yellow-400/10 text-yellow-100/90"
                    : "border-red-500/20 bg-red-500/10 text-red-200/90")
                }
              >
                {status.text}
              </div>
            ) : null}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-medium text-zinc-200/90">Меню (JSON)</div>
              <div className="mt-1 text-[11px] text-zinc-300/70">
                Можно добавлять новые подразделы каталога, бренды, “прицелы и прочее”.
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              className="h-9 rounded-xl border-white/10 bg-white/5 px-3 text-xs font-semibold text-zinc-50 hover:bg-white/10"
              onClick={() => setMenuJson(JSON.stringify(config.menu, null, 2))}
            >
              Перезаполнить
            </Button>
          </div>
          <Textarea
            className="mt-3 h-[520px] resize-none rounded-2xl border-white/10 bg-black/40 font-mono text-xs text-zinc-50"
            value={menuJson}
            onChange={(e) => setMenuJson(e.currentTarget.value)}
            spellCheck={false}
          />
        </div>
      </div>
      </CardContent>
    </Card>
  );
}

