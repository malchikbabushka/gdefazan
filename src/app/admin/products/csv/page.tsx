"use client";

import { useMemo, useState } from "react";
import type { Product } from "@/lib/catalog-types";
import { parseCsv, toCsv } from "@/lib/csv";
import { formatRub, parseOptionalInt } from "@/lib/catalog-logic";
import { saveProductsToStorage, useProducts } from "@/lib/products-store";

const FIELD_DEFS: Array<{
  key: keyof Product;
  label: string;
  toString: (p: Product) => string;
  fromString: (raw: string, prev: Product) => Product;
}> = [
  { key: "id", label: "id", toString: (p) => p.id, fromString: (raw, prev) => ({ ...prev, id: raw }) },
  { key: "brand", label: "brand", toString: (p) => p.brand, fromString: (raw, prev) => ({ ...prev, brand: raw }) },
  { key: "name", label: "name", toString: (p) => p.name, fromString: (raw, prev) => ({ ...prev, name: raw }) },
  {
    key: "type",
    label: "type (scope|monocular)",
    toString: (p) => p.type,
    fromString: (raw, prev) => ({ ...prev, type: raw === "monocular" ? "monocular" : "scope" }),
  },
  {
    key: "priceRub",
    label: "priceRub",
    toString: (p) => String(p.priceRub),
    fromString: (raw, prev) => ({ ...prev, priceRub: parseOptionalInt(raw) ?? prev.priceRub }),
  },
  {
    key: "matrix",
    label: "matrix",
    toString: (p) => p.matrix,
    fromString: (raw, prev) => ({
      ...prev,
      matrix:
        raw === "384×288" || raw === "640×512" || raw === "1024×768" || raw === "1280×1024"
          ? raw
          : prev.matrix,
    }),
  },
  {
    key: "lensMm",
    label: "lensMm",
    toString: (p) => String(p.lensMm),
    fromString: (raw, prev) => {
      const v = parseOptionalInt(raw);
      const lens = v === 19 || v === 25 || v === 35 || v === 50 ? v : prev.lensMm;
      return { ...prev, lensMm: lens };
    },
  },
  {
    key: "magnificationMin",
    label: "magnificationMin",
    toString: (p) => String(p.magnificationMin),
    fromString: (raw, prev) => {
      const n = Number(raw.replace(",", "."));
      return { ...prev, magnificationMin: Number.isFinite(n) ? n : prev.magnificationMin };
    },
  },
  {
    key: "magnificationMax",
    label: "magnificationMax",
    toString: (p) => String(p.magnificationMax),
    fromString: (raw, prev) => {
      const n = Number(raw.replace(",", "."));
      return { ...prev, magnificationMax: Number.isFinite(n) ? n : prev.magnificationMax };
    },
  },
  {
    key: "hasRangefinder",
    label: "hasRangefinder (true|false)",
    toString: (p) => String(p.hasRangefinder),
    fromString: (raw, prev) => ({ ...prev, hasRangefinder: raw.trim().toLowerCase() === "true" }),
  },
  {
    key: "inStock",
    label: "inStock (true|false)",
    toString: (p) => String(p.inStock),
    fromString: (raw, prev) => ({ ...prev, inStock: raw.trim().toLowerCase() === "true" }),
  },
  {
    key: "popularity",
    label: "popularity",
    toString: (p) => String(p.popularity),
    fromString: (raw, prev) => ({ ...prev, popularity: parseOptionalInt(raw) ?? prev.popularity }),
  },
];

function downloadTextFile(filename: string, text: string) {
  const blob = new Blob([text], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function AdminProductsCsvPage() {
  const { products, setProducts } = useProducts();
  const [delimiter, setDelimiter] = useState<"," | ";" | "\t">(";");
  const [selectedFields, setSelectedFields] = useState<Set<keyof Product>>(
    () =>
      new Set<keyof Product>([
        "id",
        "brand",
        "name",
        "type",
        "priceRub",
        "matrix",
        "lensMm",
        "magnificationMin",
        "magnificationMax",
        "hasRangefinder",
        "inStock",
        "popularity",
      ]),
  );
  const [importText, setImportText] = useState("");
  const [status, setStatus] = useState<{ kind: "idle" | "ok" | "error"; text?: string }>({
    kind: "idle",
  });

  const selectedDefs = useMemo(
    () => FIELD_DEFS.filter((d) => selectedFields.has(d.key)),
    [selectedFields],
  );

  const sample = useMemo(() => products.slice(0, 3), [products]);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">
            CSV импорт/экспорт (каталог)
          </h1>
          <p className="mt-2 text-sm text-zinc-200/75">
            Это CSV для витрины каталога (тепловизоры). Для “админ-товаров (оптика/коллиматоры)”
            есть отдельный CRUD.
          </p>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
          <h2 className="text-sm font-semibold text-zinc-50">Экспорт</h2>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <div className="text-xs font-medium text-zinc-200/90">Разделитель</div>
            <select
              className="h-10 rounded-xl border border-white/10 bg-black/40 px-3 text-sm text-zinc-50 outline-none ring-yellow-400/30 focus:ring-2"
              value={delimiter}
              onChange={(e) => setDelimiter(e.currentTarget.value as any)}
            >
              <option value=";">; (точка с запятой)</option>
              <option value=",">, (запятая)</option>
              <option value="\t">TAB</option>
            </select>
          </div>

          <div className="mt-4">
            <div className="text-xs font-medium text-zinc-200/90">Поля</div>
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {FIELD_DEFS.map((f) => (
                <label
                  key={String(f.key)}
                  className="flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-zinc-200/90 hover:bg-white/8"
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-yellow-400"
                    checked={selectedFields.has(f.key)}
                    onChange={() => {
                      const next = new Set(selectedFields);
                      if (next.has(f.key)) next.delete(f.key);
                      else next.add(f.key);
                      setSelectedFields(next);
                    }}
                  />
                  {f.label}
                </label>
              ))}
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              className="h-10 rounded-xl bg-yellow-400 px-4 text-sm font-semibold text-black transition hover:bg-yellow-300"
              onClick={() => {
                if (selectedDefs.length === 0) {
                  setStatus({ kind: "error", text: "Выберите хотя бы одно поле для экспорта." });
                  return;
                }
                const rows = products.map((p) => {
                  const r: Record<string, string> = {};
                  for (const d of selectedDefs) r[String(d.key)] = d.toString(p);
                  return r;
                });
                const csv = toCsv(rows, { delimiter });
                downloadTextFile("products.csv", csv);
                setStatus({ kind: "ok", text: `Экспортировано: ${products.length} товаров.` });
              }}
            >
              Скачать CSV
            </button>

            <button
              type="button"
              className="h-10 rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-zinc-50 transition hover:bg-white/10"
              onClick={() => {
                setSelectedFields(new Set(FIELD_DEFS.map((d) => d.key)));
                setStatus({ kind: "ok", text: "Выбраны все поля." });
              }}
            >
              Выбрать все поля
            </button>
          </div>

          <div className="mt-5 rounded-2xl border border-white/10 bg-black/40 p-4">
            <div className="text-xs font-semibold text-zinc-50">Пример товаров</div>
            <div className="mt-2 space-y-1 text-xs text-zinc-200/70">
              {sample.map((p) => (
                <div key={p.id} className="flex justify-between gap-3">
                  <span className="truncate">
                    {p.brand} {p.name}
                  </span>
                  <span className="tabular-nums">{formatRub(p.priceRub)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
          <h2 className="text-sm font-semibold text-zinc-50">Импорт</h2>
          <p className="mt-2 text-xs leading-5 text-zinc-200/70">
            Вставьте CSV с заголовками (первая строка). Колонки должны называться как поля
            объекта (например: <span className="font-mono">id, name, priceRub</span>).
            Неизвестные колонки игнорируются.
          </p>

          <textarea
            className="mt-4 h-[320px] w-full resize-none rounded-2xl border border-white/10 bg-black/40 p-3 font-mono text-xs text-zinc-50 outline-none ring-yellow-400/30 focus:ring-2"
            value={importText}
            onChange={(e) => setImportText(e.currentTarget.value)}
            placeholder={
              "id;brand;name;type;priceRub;matrix;lensMm;magnificationMin;magnificationMax;hasRangefinder;inStock;popularity\np10;Raven;XR 35 LRF;scope;219000;640×512;35;1.6;6.4;true;true;90"
            }
            spellCheck={false}
          />

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              className="h-10 rounded-xl bg-yellow-400 px-4 text-sm font-semibold text-black transition hover:bg-yellow-300"
              onClick={() => {
                const { headers, records } = parseCsv(importText, { delimiter });
                if (!headers.length) {
                  setStatus({ kind: "error", text: "CSV пустой или не содержит заголовков." });
                  return;
                }

                const defByKey = new Map(FIELD_DEFS.map((d) => [String(d.key), d] as const));
                const validKeys = headers.filter((h) => defByKey.has(h));

                if (validKeys.length === 0) {
                  setStatus({
                    kind: "error",
                    text: "Не нашёл ни одной известной колонки. Проверьте заголовки CSV.",
                  });
                  return;
                }

                const imported: Product[] = records.map((rec, idx) => {
                  let p: Product = {
                    id: `import-${idx + 1}`,
                    brand: "Brand",
                    name: "Product",
                    type: "scope",
                    priceRub: 0,
                    matrix: "640×512",
                    lensMm: 35,
                    magnificationMin: 1,
                    magnificationMax: 4,
                    hasRangefinder: false,
                    inStock: true,
                    popularity: 50,
                  };
                  for (const k of validKeys) {
                    const def = defByKey.get(k)!;
                    p = def.fromString(rec[k] ?? "", p);
                  }
                  return p;
                });

                setProducts(imported);
                saveProductsToStorage(imported);
                setStatus({ kind: "ok", text: `Импортировано: ${imported.length} товаров.` });
              }}
            >
              Импортировать (заменить список)
            </button>
            <button
              type="button"
              className="h-10 rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-zinc-50 transition hover:bg-white/10"
              onClick={() => {
                setImportText("");
                setStatus({ kind: "ok", text: "Очищено." });
              }}
            >
              Очистить
            </button>
          </div>
        </div>
      </div>

      {status.kind !== "idle" ? (
        <div
          className={
            "mt-6 rounded-2xl border p-4 text-sm " +
            (status.kind === "ok"
              ? "border-yellow-400/20 bg-yellow-400/10 text-yellow-100/90"
              : "border-red-500/20 bg-red-500/10 text-red-200/90")
          }
        >
          {status.text}
        </div>
      ) : null}
    </div>
  );
}

