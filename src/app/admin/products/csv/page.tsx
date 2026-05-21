"use client";

import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { parseCsv } from "@/lib/csv";
import type { AdminProduct } from "@/lib/admin-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

type Delim = "," | ";" | "\t";

type TargetField = "name" | "brand" | "priceRub" | "stockQty" | "inStock";

type ColumnMapping = Partial<Record<TargetField, string>>;

const PRESET_KEY = "thermal-shop:csv-import-presets:v1";

function normalizeKey(brand: string, name: string) {
  const b = brand.trim().toLowerCase().replace(/\s+/g, " ");
  const n = name.trim().toLowerCase().replace(/\s+/g, " ");
  return `${b}||${n}`;
}

function guessDelimiter(text: string): Delim {
  const firstLine = text.split(/\r?\n/)[0] ?? "";
  const counts: Record<Delim, number> = {
    ";": (firstLine.match(/;/g) ?? []).length,
    ",": (firstLine.match(/,/g) ?? []).length,
    "\t": (firstLine.match(/\t/g) ?? []).length,
  };
  return (Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] as Delim) ?? ";";
}

function parseBoolLoose(raw: string): boolean | null {
  const v = raw.trim().toLowerCase();
  if (!v) return null;
  if (["1", "y", "yes", "true", "да", "есть", "в наличии", "наличие"].includes(v)) return true;
  if (["0", "n", "no", "false", "нет", "отсутствует", "нет в наличии"].includes(v)) return false;
  return null;
}

function parseIntLoose(raw: string): number | null {
  const v = raw.replace(/\s+/g, "").replace(",", ".").trim();
  if (!v) return null;
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return Math.trunc(n);
}

function parsePriceLoose(raw: string): number | null {
  const v = raw.replace(/\s+/g, "").replace(",", ".").trim();
  if (!v) return null;
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return Math.max(0, Math.round(n));
}

const RawRowSchema = z.object({
  rowNumber: z.number().int().positive(),
  name: z.string(),
  brand: z.string(),
  priceRub: z.string().optional(),
  stockQty: z.string().optional(),
  inStock: z.string().optional(),
});

type RowIssue = { rowNumber: number; field: TargetField | "mapping" | "match"; message: string };

type DryAction =
  | { kind: "skip"; rowNumber: number; reason: string }
  | { kind: "update"; rowNumber: number; adminProductId: string; patch: Partial<AdminProduct> }
  | { kind: "conflict"; rowNumber: number; candidates: AdminProduct[]; patch: Partial<AdminProduct> };

export default function AdminProductsCsvPage() {
  const [delimiter, setDelimiter] = useState<Delim>(";");
  const [importText, setImportText] = useState("");
  const [adminProducts, setAdminProducts] = useState<AdminProduct[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>({});
  const [presetName, setPresetName] = useState("default");
  const [issues, setIssues] = useState<RowIssue[]>([]);
  const [dryRun, setDryRun] = useState<DryAction[]>([]);
  const [conflictChoices, setConflictChoices] = useState<Record<number, string>>({});
  const [progress, setProgress] = useState<{ stage: string; done: number; total: number } | null>(null);
  const [status, setStatus] = useState<{ kind: "idle" | "ok" | "error"; text?: string }>({ kind: "idle" });
  const [fileName, setFileName] = useState<string | null>(null);
  const [lastReport, setLastReport] = useState<null | {
    startedAt: string;
    updated: number;
    opsTotal: number;
    chunks: number;
  }>(null);

  function downloadTextFile(filename: string, text: string, mime = "application/json;charset=utf-8") {
    const blob = new Blob([text], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  async function loadCsvFile(file: File) {
    setStatus({ kind: "idle" });
    setFileName(file.name || "file.csv");
    try {
      const text = await file.text();
      setImportText(text);
      setDryRun([]);
      setIssues([]);
      setConflictChoices({});
      setLastReport(null);
      setStatus({ kind: "ok", text: `Файл загружен: ${file.name} (${Math.round(file.size / 1024)} KB)` });
    } catch (e) {
      setStatus({
        kind: "error",
        text: e instanceof Error ? e.message : "Не удалось прочитать файл",
      });
    }
  }

  useEffect(() => {
    // Load admin products (for matching); no photos needed.
    fetch("/api/admin/products?includePhotos=0", { cache: "no-store", credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const list = Array.isArray(data?.products) ? (data.products as AdminProduct[]) : [];
        setAdminProducts(list);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!importText.trim()) return;
    setDelimiter(guessDelimiter(importText));
  }, [importText]);

  const parsed = useMemo(() => {
    try {
      return parseCsv(importText, { delimiter });
    } catch {
      return { headers: [] as string[], records: [] as Record<string, string>[] };
    }
  }, [importText, delimiter]);

  const headers = parsed.headers;
  const previewRows = useMemo(() => parsed.records.slice(0, 10), [parsed.records]);

  const presets = useMemo(() => {
    if (typeof window === "undefined") return {} as Record<string, ColumnMapping>;
    try {
      const raw = window.localStorage.getItem(PRESET_KEY);
      if (!raw) return {};
      return JSON.parse(raw) as Record<string, ColumnMapping>;
    } catch {
      return {};
    }
  }, []);

  function savePreset(name: string, map: ColumnMapping) {
    if (typeof window === "undefined") return;
    const next = { ...(presets ?? {}), [name]: map };
    window.localStorage.setItem(PRESET_KEY, JSON.stringify(next));
  }

  function autoMapFromHeaders() {
    const h = headers.map((x) => x.toLowerCase());
    const pick = (cands: string[]) => {
      const idx = h.findIndex((hh) => cands.some((c) => hh.includes(c)));
      return idx >= 0 ? headers[idx]! : undefined;
    };
    const next: ColumnMapping = {
      name: pick(["name", "название", "наименование", "model", "товар"]),
      brand: pick(["brand", "бренд", "производ", "manufacturer"]),
      priceRub: pick(["price", "цена", "стоим", "cost"]),
      stockQty: pick(["stock", "остат", "qty", "кол-во", "колво", "количество"]),
      inStock: pick(["instock", "налич", "available"]),
    };
    setMapping((cur) => ({ ...next, ...cur }));
  }

  const normalizedRows = useMemo(() => {
    const out: Array<z.infer<typeof RawRowSchema>> = [];
    const errs: RowIssue[] = [];
    if (!headers.length) {
      if (importText.trim()) errs.push({ rowNumber: 1, field: "mapping", message: "CSV без заголовков или пустой." });
      setIssues(errs);
      return out;
    }
    if (!mapping.name || !mapping.brand) {
      errs.push({ rowNumber: 1, field: "mapping", message: "Нужно сопоставить колонки name и brand." });
      setIssues(errs);
      return out;
    }
    for (let i = 0; i < parsed.records.length; i++) {
      const rec = parsed.records[i]!;
      const rowNumber = i + 2; // header=1
      const raw = {
        rowNumber,
        name: String(rec[mapping.name] ?? ""),
        brand: String(rec[mapping.brand] ?? ""),
        priceRub: mapping.priceRub ? String(rec[mapping.priceRub] ?? "") : undefined,
        stockQty: mapping.stockQty ? String(rec[mapping.stockQty] ?? "") : undefined,
        inStock: mapping.inStock ? String(rec[mapping.inStock] ?? "") : undefined,
      };
      const zr = RawRowSchema.safeParse(raw);
      if (!zr.success) {
        errs.push({ rowNumber, field: "mapping", message: "Не удалось разобрать строку." });
        continue;
      }
      if (!zr.data.name.trim()) errs.push({ rowNumber, field: "name", message: "Пустое название (name)." });
      if (!zr.data.brand.trim()) errs.push({ rowNumber, field: "brand", message: "Пустой бренд (brand)." });
      if (zr.data.priceRub !== undefined && zr.data.priceRub.trim() && parsePriceLoose(zr.data.priceRub) === null) {
        errs.push({ rowNumber, field: "priceRub", message: "Цена не число." });
      }
      if (zr.data.stockQty !== undefined && zr.data.stockQty.trim() && parseIntLoose(zr.data.stockQty) === null) {
        errs.push({ rowNumber, field: "stockQty", message: "Остаток не число." });
      }
      if (zr.data.inStock !== undefined && zr.data.inStock.trim() && parseBoolLoose(zr.data.inStock) === null) {
        errs.push({ rowNumber, field: "inStock", message: "Наличие не распознано (да/нет, 1/0, true/false)." });
      }
      out.push(zr.data);
    }
    setIssues(errs);
    return out;
  }, [headers.length, importText, mapping, parsed.records]);

  function computeDryRun() {
    setStatus({ kind: "idle" });
    const errs = issues.filter((x) => x.field !== "match");
    if (errs.length) {
      setStatus({ kind: "error", text: "Исправьте ошибки валидации/маппинга перед dry-run." });
      return;
    }
    const byKey = new Map<string, AdminProduct[]>();
    for (const p of adminProducts) {
      const k = normalizeKey(p.brand, p.name);
      const list = byKey.get(k) ?? [];
      list.push(p);
      byKey.set(k, list);
    }
    const actions: DryAction[] = [];
    const matchIssues: RowIssue[] = [];
    for (const r of normalizedRows) {
      const k = normalizeKey(r.brand, r.name);
      const candidates = byKey.get(k) ?? [];
      const patch: Partial<AdminProduct> = {};
      if (r.priceRub !== undefined && r.priceRub.trim()) patch.priceRub = parsePriceLoose(r.priceRub) ?? undefined;
      if (r.stockQty !== undefined && r.stockQty.trim()) patch.stockQty = Math.max(0, parseIntLoose(r.stockQty) ?? 0);
      if (r.inStock !== undefined && r.inStock.trim()) patch.inStock = parseBoolLoose(r.inStock) ?? undefined;
      const hasAny = Object.keys(patch).length > 0;
      if (!hasAny) {
        actions.push({ kind: "skip", rowNumber: r.rowNumber, reason: "Нет данных для обновления." });
        continue;
      }
      if (candidates.length === 0) {
        actions.push({ kind: "skip", rowNumber: r.rowNumber, reason: "Не найден товар (brand+name)." });
        continue;
      }
      if (candidates.length === 1) {
        actions.push({
          kind: "update",
          rowNumber: r.rowNumber,
          adminProductId: candidates[0]!.id,
          patch,
        });
        continue;
      }
      matchIssues.push({
        rowNumber: r.rowNumber,
        field: "match",
        message: `Найдено совпадений: ${candidates.length}. Нужно выбрать товар.`,
      });
      actions.push({ kind: "conflict", rowNumber: r.rowNumber, candidates, patch });
    }
    setIssues((cur) => [...cur.filter((x) => x.field !== "match"), ...matchIssues]);
    setDryRun(actions);
  }

  const canApply = useMemo(() => {
    if (!dryRun.length) return false;
    const invalid = issues.filter((x) => x.field !== "match");
    if (invalid.length) return false;
    for (const a of dryRun) {
      if (a.kind === "conflict") {
        if (!conflictChoices[a.rowNumber]) return false;
      }
    }
    return true;
  }, [conflictChoices, dryRun, issues]);

  async function applyUpdateOnly() {
    if (!canApply) return;
    setStatus({ kind: "idle" });
    const ops: Array<{ id: string; patch: { priceRub?: number; stockQty?: number; inStock?: boolean } }> = [];
    for (const a of dryRun) {
      if (a.kind === "update") ops.push({ id: a.adminProductId, patch: a.patch });
      if (a.kind === "conflict") {
        const picked = conflictChoices[a.rowNumber];
        if (picked) ops.push({ id: picked, patch: a.patch });
      }
    }
    const chunkSize = 200;
    setProgress({ stage: "apply", done: 0, total: ops.length });
    const startedAt = new Date().toISOString();
    const chunks = Math.ceil(ops.length / chunkSize);
    let okCount = 0;
    for (let i = 0; i < ops.length; i += chunkSize) {
      const chunk = ops.slice(i, i + chunkSize);
      const r = await fetch("/api/admin/products/import", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mode: "updateOnly", ops: chunk }),
      });
      const body = (await r.json().catch(() => ({}))) as { error?: string; updated?: number };
      if (!r.ok) {
        setProgress(null);
        setStatus({ kind: "error", text: body.error ?? "Импорт не выполнен." });
        return;
      }
      okCount += Number(body.updated ?? chunk.length);
      setProgress({ stage: "apply", done: Math.min(i + chunk.length, ops.length), total: ops.length });
    }
    setProgress(null);
    setLastReport({ startedAt, updated: okCount, opsTotal: ops.length, chunks });
    setStatus({ kind: "ok", text: `Готово. Обновлено: ${okCount}.` });
  }

  return (
    <Card className="border-white/10 bg-white/5">
      <CardHeader className="space-y-2">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <CardTitle className="text-2xl font-semibold tracking-tight text-zinc-50">
              CSV импорт (админка → цены/остатки/наличие)
            </CardTitle>
            <p className="mt-2 text-sm text-zinc-200/75">
              Гибкий инструмент: маппинг колонок, preview, валидация по строкам, dry‑run план и безопасное применение
              только <span className="font-mono">priceRub/stockQty/inStock</span> с подтверждением конфликтов.
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 pt-0 space-y-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-semibold text-zinc-50">CSV</div>
              <div className="flex items-center gap-2 text-xs text-zinc-300/70">
                <span>Разделитель</span>
                <select
                  className="h-9 rounded-xl border border-white/10 bg-black/40 px-3 text-xs text-zinc-50 outline-none ring-yellow-400/30 focus:ring-2"
                  value={delimiter}
                  onChange={(e) => setDelimiter(e.currentTarget.value as Delim)}
                >
                  <option value=";">; (точка с запятой)</option>
                  <option value=",">, (запятая)</option>
                  <option value="\t">TAB</option>
                </select>
              </div>
            </div>

            <div
              className="mt-4 rounded-2xl border border-dashed border-white/15 bg-black/20 p-4"
              onDragOver={(e) => {
                e.preventDefault();
              }}
              onDrop={(e) => {
                e.preventDefault();
                const f = e.dataTransfer.files?.[0];
                if (f) void loadCsvFile(f);
              }}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs text-zinc-200/70">
                  {fileName ? (
                    <>
                      Файл: <span className="font-mono text-zinc-100/90">{fileName}</span>
                    </>
                  ) : (
                    <>Перетащи CSV сюда или выбери файл.</>
                  )}
                </div>
                <label className="inline-flex cursor-pointer items-center justify-center rounded-xl bg-yellow-400 px-3 py-2 text-xs font-semibold text-black hover:bg-yellow-300">
                  Выбрать файл
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.currentTarget.files?.[0];
                      if (f) void loadCsvFile(f);
                      e.currentTarget.value = "";
                    }}
                  />
                </label>
              </div>
              <div className="mt-2 text-[11px] text-zinc-400">
                Подсказка: если файл в Excel, лучше экспортировать как CSV (UTF‑8). Разделитель можно выбрать вручную.
              </div>
            </div>

            <Textarea
              className="mt-4 h-[320px] w-full resize-none rounded-2xl border border-white/10 bg-black/40 p-3 font-mono text-xs text-zinc-50"
              value={importText}
              onChange={(e) => setImportText(e.currentTarget.value)}
              placeholder={"brand;name;price;stock;inStock\nRaven;XR 35 LRF;219000;10;да"}
              spellCheck={false}
            />

            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                className="h-9 rounded-xl border-white/10 bg-white/5 text-xs text-zinc-50"
                onClick={autoMapFromHeaders}
                disabled={!headers.length}
              >
                Автомаппинг по заголовкам
              </Button>
              {lastReport ? (
                <Button
                  type="button"
                  variant="outline"
                  className="h-9 rounded-xl border-white/10 bg-white/5 text-xs text-zinc-50"
                  onClick={() => {
                    downloadTextFile(
                      `csv-import-report_${new Date(lastReport.startedAt).toISOString().slice(0, 19).replace(/[:]/g, "-")}.json`,
                      JSON.stringify(lastReport, null, 2),
                    );
                  }}
                >
                  Скачать отчёт (JSON)
                </Button>
              ) : null}
              <Button
                type="button"
                variant="outline"
                className="h-9 rounded-xl border-white/10 bg-white/5 text-xs text-zinc-50"
                onClick={() => {
                  setImportText("");
                  setFileName(null);
                  setDryRun([]);
                  setIssues([]);
                  setConflictChoices({});
                  setLastReport(null);
                  setStatus({ kind: "ok", text: "Очищено." });
                }}
              >
                Очистить
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
            <div className="text-sm font-semibold text-zinc-50">Маппинг колонок</div>
            <p className="mt-2 text-xs text-zinc-200/70">
              Обязательно сопоставьте <span className="font-mono">name</span> и <span className="font-mono">brand</span>.
            </p>

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {(["name", "brand", "priceRub", "stockQty", "inStock"] as TargetField[]).map((f) => (
                <div key={f} className="rounded-2xl border border-white/10 bg-black/40 p-3">
                  <div className="text-xs font-semibold text-zinc-100">{f}</div>
                  <select
                    className="mt-2 h-9 w-full rounded-xl border border-white/10 bg-black/40 px-3 text-xs text-zinc-50 outline-none ring-yellow-400/30 focus:ring-2"
                    value={mapping[f] ?? ""}
                    onChange={(e) => setMapping((cur) => ({ ...cur, [f]: e.currentTarget.value || undefined }))}
                  >
                    <option value="">— не выбрано —</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            <Separator className="my-4 bg-white/10" />

            <div className="flex flex-wrap items-end gap-2">
              <div className="min-w-[200px] flex-1">
                <div className="text-xs text-zinc-300/70">Preset</div>
                <Input
                  className="mt-2 h-9 rounded-xl border-white/10 bg-black/40 text-xs text-zinc-50"
                  value={presetName}
                  onChange={(e) => setPresetName(e.currentTarget.value)}
                  placeholder="default"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                className="h-9 rounded-xl border-white/10 bg-white/5 text-xs text-zinc-50"
                onClick={() => {
                  savePreset(presetName.trim() || "default", mapping);
                  setStatus({ kind: "ok", text: "Preset сохранён (localStorage)." });
                }}
              >
                Сохранить preset
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-9 rounded-xl border-white/10 bg-white/5 text-xs text-zinc-50"
                onClick={() => {
                  const m = presets[presetName.trim() || "default"];
                  if (m) {
                    setMapping(m);
                    setStatus({ kind: "ok", text: "Preset применён." });
                  } else {
                    setStatus({ kind: "error", text: "Preset не найден." });
                  }
                }}
              >
                Применить preset
              </Button>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-zinc-50">Preview</div>
              <div className="mt-1 text-xs text-zinc-200/70">
                Заголовки: {headers.length ? headers.join(", ") : "—"} • строк: {parsed.records.length}
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                className="h-9 rounded-xl bg-yellow-400 text-xs font-semibold text-black hover:bg-yellow-300"
                onClick={computeDryRun}
                disabled={!parsed.records.length}
              >
                Dry‑run (план)
              </Button>
              <Button
                type="button"
                className="h-9 rounded-xl bg-yellow-400 text-xs font-semibold text-black hover:bg-yellow-300 disabled:opacity-60"
                onClick={() => void applyUpdateOnly()}
                disabled={!canApply || Boolean(progress)}
              >
                Применить (updateOnly)
              </Button>
            </div>
          </div>

          {progress ? (
            <div className="mt-3 rounded-xl border border-white/10 bg-black/40 p-3 text-xs text-zinc-200/80">
              Прогресс: {progress.stage} — {progress.done}/{progress.total}
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full bg-yellow-400/80"
                  style={{ width: `${progress.total ? Math.round((progress.done / progress.total) * 100) : 0}%` }}
                />
              </div>
            </div>
          ) : null}

          <div className="mt-4 overflow-auto rounded-xl border border-white/10">
            <table className="min-w-full text-left text-xs">
              <thead className="bg-black/60 text-zinc-200/80">
                <tr>
                  {headers.slice(0, 8).map((h) => (
                    <th key={h} className="px-3 py-2 font-semibold">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {previewRows.map((r, idx) => (
                  <tr key={idx} className="text-zinc-100/85">
                    {headers.slice(0, 8).map((h) => (
                      <td key={h} className="px-3 py-2 whitespace-nowrap">
                        {r[h] ?? ""}
                      </td>
                    ))}
                  </tr>
                ))}
                {previewRows.length === 0 ? (
                  <tr>
                    <td className="px-3 py-10 text-center text-zinc-500" colSpan={8}>
                      Нет данных
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          {issues.length ? (
            <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200/90">
              <div className="font-semibold">Ошибки / конфликты</div>
              <ul className="mt-2 space-y-1 text-xs">
                {issues.slice(0, 50).map((it, i) => (
                  <li key={i}>
                    <span className="font-mono">строка {it.rowNumber}</span>: {it.field} — {it.message}
                  </li>
                ))}
              </ul>
              {issues.length > 50 ? <div className="mt-2 text-xs">…ещё {issues.length - 50}</div> : null}
            </div>
          ) : null}

          {dryRun.length ? (
            <div className="mt-4 rounded-2xl border border-white/10 bg-black/40 p-4">
              <div className="text-sm font-semibold text-zinc-50">Dry‑run план</div>
              <div className="mt-2 space-y-2 text-xs text-zinc-200/80">
                {dryRun.slice(0, 200).map((a) => {
                  if (a.kind === "skip") {
                    return (
                      <div key={a.rowNumber} className="flex justify-between gap-3">
                        <span className="font-mono">строка {a.rowNumber}</span>
                        <span className="text-zinc-400">skip</span>
                        <span className="ml-auto text-zinc-300/70">{a.reason}</span>
                      </div>
                    );
                  }
                  if (a.kind === "update") {
                    return (
                      <div key={a.rowNumber} className="flex justify-between gap-3">
                        <span className="font-mono">строка {a.rowNumber}</span>
                        <span className="text-green-400">update</span>
                        <span className="ml-auto font-mono text-zinc-400">{a.adminProductId}</span>
                      </div>
                    );
                  }
                  const choice = conflictChoices[a.rowNumber] ?? "";
                  return (
                    <div key={a.rowNumber} className="flex flex-wrap items-center gap-3">
                      <span className="font-mono">строка {a.rowNumber}</span>
                      <span className="text-amber-300">conflict</span>
                      <select
                        className="h-9 rounded-xl border border-white/10 bg-black/40 px-3 text-xs text-zinc-50 outline-none"
                        value={choice}
                        onChange={(e) =>
                          setConflictChoices((cur) => ({ ...cur, [a.rowNumber]: e.currentTarget.value }))
                        }
                      >
                        <option value="">— выбрать товар —</option>
                        {a.candidates.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.brand} {c.name} ({c.id})
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                })}
                {dryRun.length > 200 ? <div>…ещё {dryRun.length - 200}</div> : null}
              </div>
            </div>
          ) : null}
        </div>

        {status.kind !== "idle" ? (
          <div
            className={
              "rounded-2xl border p-4 text-sm " +
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
  );
}

