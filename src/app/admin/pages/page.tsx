"use client";

import { useEffect, useMemo, useState } from "react";
import type { PageContent, PageKey } from "@/lib/pages-store";
import {
  DEFAULT_PAGES,
  getPageContent,
  loadPagesFromStorage,
  savePagesToStorage,
} from "@/lib/pages-store";
import { SimpleContent } from "@/components/content/SimpleContent";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";

const PAGE_KEYS: Array<{ key: PageKey; label: string }> = [
  { key: "warranty", label: "Гарантия и возврат" },
  { key: "shipping-payment", label: "Доставка и оплата" },
  { key: "brands", label: "Бренды (описание)" },
];

export default function AdminPages() {
  const [selectedKey, setSelectedKey] = useState<PageKey>("warranty");
  const [stored, setStored] = useState<Partial<Record<PageKey, PageContent>> | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [status, setStatus] = useState<{ kind: "idle" | "ok" | "error"; text?: string }>({
    kind: "idle",
  });

  useEffect(() => {
    const s = loadPagesFromStorage();
    setStored(s ?? {});
  }, []);

  const current = useMemo(() => getPageContent(selectedKey, stored), [selectedKey, stored]);

  useEffect(() => {
    setTitle(current.title);
    setBody(current.body);
    setStatus({ kind: "idle" });
  }, [current.title, current.body, selectedKey]);

  const preview = useMemo<PageContent>(() => ({ title, body }), [title, body]);

  return (
    <Card className="border-white/10 bg-white/5">
      <CardHeader className="space-y-2">
        <CardTitle className="text-2xl font-semibold tracking-tight text-zinc-50">
          Редактор страниц (демо)
        </CardTitle>
        <p className="text-sm text-zinc-200/75">
          Редактирование заголовка и текста. Текст поддерживает абзацы и списки (строки
          начиная с <span className="font-mono">- </span>).
        </p>
      </CardHeader>
      <CardContent className="p-6 pt-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Tabs value={selectedKey} onValueChange={(v) => setSelectedKey(v as PageKey)}>
            <TabsList className="rounded-xl border border-white/10 bg-white/5">
              {PAGE_KEYS.map((p) => (
                <TabsTrigger key={p.key} value={p.key} className="text-xs sm:text-sm">
                  {p.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <Button
            type="button"
            variant="outline"
            className="h-10 rounded-xl border-white/10 bg-white/5 text-zinc-50 hover:bg-white/10"
            onClick={() => {
              const next = { ...(stored ?? {}) };
              delete next[selectedKey];
              setStored(next);
              savePagesToStorage(next);
              setStatus({ kind: "ok", text: "Сброшено к дефолту." });
            }}
          >
            Сбросить страницу
          </Button>
        </div>

        <Separator className="my-6 bg-white/10" />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card className="border-white/10 bg-black/30">
            <CardContent className="p-5">
              <div className="text-sm font-semibold text-zinc-50">Редактирование</div>

              <div className="mt-4">
                <label className="text-xs font-medium text-zinc-200/90">Заголовок</label>
                <Input
                  className="mt-2 h-10 rounded-xl border-white/10 bg-black/40 text-zinc-50"
                  value={title}
                  onChange={(e) => setTitle(e.currentTarget.value)}
                />
              </div>

              <div className="mt-4">
                <label className="text-xs font-medium text-zinc-200/90">Текст</label>
                <Textarea
                  className="mt-2 h-[360px] resize-none rounded-2xl border-white/10 bg-black/40 font-mono text-xs text-zinc-50"
                  value={body}
                  onChange={(e) => setBody(e.currentTarget.value)}
                  spellCheck={false}
                />
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <Button
                  type="button"
                  className="h-10 rounded-xl bg-yellow-400 px-4 text-sm font-semibold text-black hover:bg-yellow-300"
                  onClick={() => {
                    const next = { ...(stored ?? {}) };
                    next[selectedKey] = { title, body };
                    setStored(next);
                    savePagesToStorage(next);
                    setStatus({ kind: "ok", text: "Сохранено." });
                  }}
                >
                  Сохранить
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 rounded-xl border-white/10 bg-white/5 px-4 text-sm font-semibold text-zinc-50 hover:bg-white/10"
                  onClick={() => {
                    const def = DEFAULT_PAGES[selectedKey];
                    setTitle(def.title);
                    setBody(def.body);
                    setStatus({ kind: "ok", text: "Подставлены дефолтные значения." });
                  }}
                >
                  Подставить дефолт
                </Button>
              </div>

              {status.kind !== "idle" ? (
                <div
                  className={
                    "mt-4 rounded-2xl border p-4 text-sm " +
                    (status.kind === "ok"
                      ? "border-yellow-400/20 bg-yellow-400/10 text-yellow-100/90"
                      : "border-red-500/20 bg-red-500/10 text-red-200/90")
                  }
                >
                  {status.text}
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-black/30">
            <CardContent className="p-5">
              <div className="text-sm font-semibold text-zinc-50">Превью</div>
              <div className="mt-4">
                <SimpleContent content={preview} />
              </div>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
}

