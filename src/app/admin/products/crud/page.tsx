"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  ImageUp,
  ArrowLeft,
  ArrowRight,
  Star,
} from "lucide-react";
import type { AdminProduct, AdminProductCategory } from "@/lib/admin-types";
import { parseOptionalInt } from "@/lib/catalog-logic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AdminProductsToolbar } from "@/components/admin/products/AdminProductsToolbar";
import { AdminProductsDataTable } from "@/components/admin/products/AdminProductsDataTable";
import { AdminProductsPaginationBar } from "@/components/admin/products/AdminProductsPaginationBar";
import { AdminProductsBulkDialog } from "@/components/admin/products/AdminProductsBulkDialog";

type FormState = Omit<AdminProduct, "createdAt" | "updatedAt">;

const EMPTY_FORM: FormState = {
  id: "",
  name: "",
  brand: "",
  priceRub: 0,
  stockQty: 0,
  published: true,
  category: "thermal-scope",
  magnification: "",
  lensDiameterMm: 0,
  inStock: true,
  linkedCatalogProductId: null,
  description: "",
  specsText: "",
  photoDataUrls: [],
};

async function readFileAsDataUrl(file: File) {
  return await new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onerror = () => reject(new Error("file read error"));
    r.onload = () => resolve(String(r.result));
    r.readAsDataURL(file);
  });
}

async function readApiErrorMessage(r: Response, fallback: string): Promise<string> {
  try {
    const j = (await r.json()) as { error?: unknown };
    if (typeof j.error === "string" && j.error.trim()) return j.error.trim();
  } catch {
    /* ignore */
  }
  return fallback;
}

function productToForm(p: AdminProduct): FormState {
  return {
    id: p.id,
    name: p.name,
    brand: p.brand,
    priceRub: p.priceRub,
    stockQty: p.stockQty,
    published: p.published,
    category: p.category,
    magnification: p.magnification,
    lensDiameterMm: p.lensDiameterMm,
    inStock: p.inStock,
    linkedCatalogProductId:
      typeof p.linkedCatalogProductId === "string" && p.linkedCatalogProductId.trim()
        ? p.linkedCatalogProductId.trim()
        : null,
    description: p.description ?? "",
    specsText: p.specsText ?? "",
    photoDataUrls: Array.isArray(p.photoDataUrls) ? p.photoDataUrls : [],
  };
}

export default function AdminProductsCrudPage() {
  const [items, setItems] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ kind: "idle" | "ok" | "error"; text?: string }>({
    kind: "idle",
  });

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<AdminProductCategory | "all">("all");
  const [stockFilter, setStockFilter] = useState<"all" | "yes" | "no">("all");
  const [publishedFilter, setPublishedFilter] = useState<"all" | "yes" | "no">("all");
  const [brandFilter, setBrandFilter] = useState("all");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [bulkOpen, setBulkOpen] = useState(false);
  const [rowBusyId, setRowBusyId] = useState<string | null>(null);
  /** Пока идёт PUT по строке — блок числовых полей и спиннер. */
  const [patchSavingId, setPatchSavingId] = useState<string | null>(null);
  /** Последний ответ API (видно без вкладки «Сеть»). */
  const [putTrace, setPutTrace] = useState<{
    method: string;
    path: string;
    status: number;
    ms: number;
  } | null>(null);

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const canStorageUpload = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL?.trim());

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setStatus({ kind: "idle" });
    try {
      const r = await fetch("/api/admin/products?includePhotos=0", {
        cache: "no-store",
        credentials: "include",
      });
      if (!r.ok) throw new Error(await readApiErrorMessage(r, "Не удалось загрузить список"));
      const data = (await r.json()) as { products: AdminProduct[] };
      const list = Array.isArray(data.products) ? data.products : [];
      setItems(list);
      setSelectedIds((prev) => new Set([...prev].filter((id) => list.some((p) => p.id === id))));
    } catch (e) {
      setStatus({ kind: "error", text: e instanceof Error ? e.message : "Ошибка загрузки" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

  const filtered = useMemo(() => {
    let list = items;
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.id.toLowerCase().includes(q) ||
          Boolean(
            p.linkedCatalogProductId && p.linkedCatalogProductId.toLowerCase().includes(q),
          ),
      );
    }
    if (category !== "all") list = list.filter((p) => p.category === category);
    if (stockFilter === "yes") list = list.filter((p) => p.inStock);
    if (stockFilter === "no") list = list.filter((p) => !p.inStock);
    if (publishedFilter === "yes") list = list.filter((p) => p.published);
    if (publishedFilter === "no") list = list.filter((p) => !p.published);
    if (brandFilter !== "all") list = list.filter((p) => p.brand === brandFilter);
    const pMin = parseOptionalInt(priceMin);
    const pMax = parseOptionalInt(priceMax);
    if (pMin !== undefined) list = list.filter((p) => p.priceRub >= pMin);
    if (pMax !== undefined) list = list.filter((p) => p.priceRub <= pMax);
    return list;
  }, [items, search, category, stockFilter, publishedFilter, brandFilter, priceMin, priceMax]);

  const brands = useMemo(() => {
    const u = new Set<string>();
    for (const p of items) {
      if (p.brand?.trim()) u.add(p.brand.trim());
    }
    return [...u].sort((a, b) => a.localeCompare(b, "ru"));
  }, [items]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  useEffect(() => {
    setPage((p) => Math.min(p, totalPages));
  }, [totalPages]);

  const pageItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const isEditing = editingId !== null;

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setOpen(true);
  };

  const openEdit = async (p: AdminProduct) => {
    setLoading(true);
    setStatus({ kind: "idle" });
    try {
      const r = await fetch(
        `/api/admin/products/${encodeURIComponent(p.id)}?includePhotos=1`,
        { cache: "no-store", credentials: "include" },
      );
      if (!r.ok) throw new Error(await readApiErrorMessage(r, "Не удалось загрузить карточку"));
      const data = (await r.json()) as { product?: AdminProduct };
      const full = data.product;
      if (!full) throw new Error("Пустой ответ");
      setEditingId(full.id);
      setForm(productToForm(full));
      setOpen(true);
    } catch (e) {
      setStatus({
        kind: "error",
        text: e instanceof Error ? e.message : "Ошибка загрузки карточки",
      });
    } finally {
      setLoading(false);
    }
  };

  const duplicateProduct = async (p: AdminProduct) => {
    setRowBusyId(p.id);
    setStatus({ kind: "idle" });
    try {
      const r = await fetch(
        `/api/admin/products/${encodeURIComponent(p.id)}?includePhotos=1`,
        { cache: "no-store", credentials: "include" },
      );
      if (!r.ok) throw new Error(await readApiErrorMessage(r, "Не удалось загрузить для копирования"));
      const data = (await r.json()) as { product?: AdminProduct };
      const full = data.product;
      if (!full) throw new Error("Пустой ответ");
      const r2 = await fetch("/api/admin/products", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: `${full.name} (копия)`,
          brand: full.brand,
          priceRub: full.priceRub,
          stockQty: full.stockQty,
          published: full.published,
          category: full.category,
          magnification: full.magnification,
          lensDiameterMm: full.lensDiameterMm,
          inStock: full.inStock,
          linkedCatalogProductId: full.linkedCatalogProductId,
          description: full.description,
          specsText: full.specsText,
          photoDataUrls: full.photoDataUrls,
        }),
      });
      if (!r2.ok) throw new Error(await readApiErrorMessage(r2, "Не удалось создать копию"));
      setStatus({ kind: "ok", text: "Копия создана." });
      await fetchAll();
    } catch (e) {
      setStatus({ kind: "error", text: e instanceof Error ? e.message : "Ошибка" });
    } finally {
      setRowBusyId(null);
    }
  };

  const patchProduct = async (id: string, patch: Partial<AdminProduct>): Promise<boolean> => {
    const path = `/api/admin/products/${encodeURIComponent(id)}`;
    setPatchSavingId(id);
    setItems((cur) => cur.map((x) => (x.id === id ? { ...x, ...patch } : x)));
    const t0 = typeof performance !== "undefined" ? performance.now() : 0;
    let sawResponseStatus = -1;
    try {
      const r = await fetch(path, {
        method: "PUT",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(patch),
      });
      sawResponseStatus = r.status;
      const ms =
        typeof performance !== "undefined" ? Math.round(performance.now() - t0) : 0;
      setPutTrace({ method: "PUT", path, status: r.status, ms });
      if (typeof console !== "undefined" && console.info) {
        console.info("[admin]", r.status, "PUT", path, `${ms}ms`, patch);
      }
      if (!r.ok) {
        let msg = "Не удалось сохранить строку";
        try {
          const err = (await r.json()) as { error?: string };
          if (typeof err.error === "string") msg = err.error;
        } catch {
          /* ignore */
        }
        throw new Error(msg);
      }
      const data = (await r.json()) as { product: AdminProduct };
      const product = data.product;
      setItems((cur) =>
        cur.map((x) =>
          x.id === id
            ? {
                ...product,
                photoDataUrls: x.photoDataUrls,
                photoCount: product.photoCount ?? x.photoCount,
              }
            : x,
        ),
      );
      setStatus({ kind: "ok", text: "Сохранено." });
      return true;
    } catch (e) {
      const ms =
        typeof performance !== "undefined" ? Math.round(performance.now() - t0) : 0;
      if (sawResponseStatus < 0) {
        setPutTrace({ method: "PUT", path, status: 0, ms });
        if (typeof console !== "undefined" && console.warn) {
          console.warn("[admin] PUT failed (no HTTP response)", path, e);
        }
      }
      setStatus({ kind: "error", text: e instanceof Error ? e.message : "Ошибка сохранения" });
      await fetchAll();
      return false;
    } finally {
      setPatchSavingId(null);
    }
  };

  const postBulk = async (ids: string[], op: string, payload?: Record<string, unknown>) => {
    const r = await fetch("/api/admin/products/bulk", {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ids, op, payload }),
    });
    if (!r.ok) throw new Error(await readApiErrorMessage(r, "Массовая операция не выполнена"));
  };

  const handleBulkApply = async (ops: {
    setPrice?: number;
    adjustPercent?: number;
    setStockQty?: number;
    category?: AdminProductCategory;
    inStock?: boolean;
    published?: boolean;
  }) => {
    const ids = [...selectedIds];
    if (ops.setPrice !== undefined) await postBulk(ids, "setPriceRub", { priceRub: ops.setPrice });
    if (ops.adjustPercent !== undefined)
      await postBulk(ids, "adjustPricePercent", { percent: ops.adjustPercent });
    if (ops.setStockQty !== undefined)
      await postBulk(ids, "setStockQty", { stockQty: ops.setStockQty });
    if (ops.category !== undefined) await postBulk(ids, "setCategory", { category: ops.category });
    if (ops.inStock !== undefined) await postBulk(ids, "setInStock", { inStock: ops.inStock });
    if (ops.published !== undefined)
      await postBulk(ids, "setPublished", { published: ops.published });
    await fetchAll();
  };

  const onBulkDelete = async () => {
    const n = selectedIds.size;
    if (n === 0) return;
    if (!confirm(`Удалить выбранные товары (${n})?`)) return;
    setLoading(true);
    setStatus({ kind: "idle" });
    try {
      await postBulk([...selectedIds], "delete");
      setSelectedIds(new Set());
      setStatus({ kind: "ok", text: "Удалено." });
      await fetchAll();
    } catch (e) {
      setStatus({ kind: "error", text: e instanceof Error ? e.message : "Ошибка" });
    } finally {
      setLoading(false);
    }
  };

  const onBulkInStock = async (v: boolean) => {
    if (selectedIds.size === 0) return;
    setLoading(true);
    try {
      await postBulk([...selectedIds], "setInStock", { inStock: v });
      await fetchAll();
    } catch (e) {
      setStatus({ kind: "error", text: e instanceof Error ? e.message : "Ошибка" });
    } finally {
      setLoading(false);
    }
  };

  const onBulkPublished = async (v: boolean) => {
    if (selectedIds.size === 0) return;
    setLoading(true);
    try {
      await postBulk([...selectedIds], "setPublished", { published: v });
      await fetchAll();
    } catch (e) {
      setStatus({ kind: "error", text: e instanceof Error ? e.message : "Ошибка" });
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = useMemo(() => form.name.trim() && form.brand.trim(), [form.name, form.brand]);

  const movePhoto = (from: number, dir: -1 | 1) => {
    const to = from + dir;
    if (to < 0 || to >= form.photoDataUrls.length) return;
    const next = [...form.photoDataUrls];
    const tmp = next[from]!;
    next[from] = next[to]!;
    next[to] = tmp;
    setForm({ ...form, photoDataUrls: next });
  };

  const makeCover = (idx: number) => {
    if (idx <= 0 || idx >= form.photoDataUrls.length) return;
    const next = [...form.photoDataUrls];
    const [picked] = next.splice(idx, 1);
    next.unshift(picked!);
    setForm({ ...form, photoDataUrls: next });
  };

  const submit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    setStatus({ kind: "idle" });
    try {
      if (isEditing) {
        const r = await fetch(`/api/admin/products/${encodeURIComponent(editingId!)}`, {
          method: "PUT",
          credentials: "include",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(form),
        });
        if (!r.ok) throw new Error(await readApiErrorMessage(r, "Не удалось сохранить"));
        setStatus({ kind: "ok", text: "Сохранено." });
      } else {
        const r = await fetch("/api/admin/products", {
          method: "POST",
          credentials: "include",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(form),
        });
        if (!r.ok) throw new Error(await readApiErrorMessage(r, "Не удалось создать"));
        setStatus({ kind: "ok", text: "Создано." });
      }
      setOpen(false);
      await fetchAll();
    } catch (e) {
      setStatus({ kind: "error", text: e instanceof Error ? e.message : "Ошибка" });
    } finally {
      setLoading(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Удалить товар?")) return;
    setLoading(true);
    setStatus({ kind: "idle" });
    try {
      const r = await fetch(`/api/admin/products/${encodeURIComponent(id)}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!r.ok) throw new Error(await readApiErrorMessage(r, "Не удалось удалить"));
      setStatus({ kind: "ok", text: "Удалено." });
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      await fetchAll();
    } catch (e) {
      setStatus({ kind: "error", text: e instanceof Error ? e.message : "Ошибка" });
    } finally {
      setLoading(false);
    }
  };

  const resetFilters = () => {
    setSearch("");
    setCategory("all");
    setStockFilter("all");
    setPublishedFilter("all");
    setBrandFilter("all");
    setPriceMin("");
    setPriceMax("");
    setPage(1);
  };

  return (
    <Card className="border-white/10 bg-white/5">
      <CardHeader className="space-y-2">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <CardTitle className="text-2xl font-semibold tracking-tight text-zinc-50">
              Товары (CRUD)
            </CardTitle>
            <p className="mt-2 text-sm text-zinc-200/75">
              Таблица с фильтрами и быстрыми правками; полная карточка открывается по меню строки.
              Список без фото в JSON — обложка подгружается по API при наличии снимков.
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="px-6 pt-0">
          <AdminProductsToolbar
            search={search}
            onSearchChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            category={category}
            onCategoryChange={(v) => {
              setCategory(v);
              setPage(1);
            }}
            stockFilter={stockFilter}
            onStockFilterChange={(v) => {
              setStockFilter(v);
              setPage(1);
            }}
            publishedFilter={publishedFilter}
            onPublishedFilterChange={(v) => {
              setPublishedFilter(v);
              setPage(1);
            }}
            brandFilter={brandFilter}
            onBrandFilterChange={(v) => {
              setBrandFilter(v);
              setPage(1);
            }}
            brands={brands}
            priceMin={priceMin}
            priceMax={priceMax}
            onPriceMinChange={(v) => {
              setPriceMin(v);
              setPage(1);
            }}
            onPriceMaxChange={(v) => {
              setPriceMax(v);
              setPage(1);
            }}
            onResetFilters={resetFilters}
            loading={loading}
            onRefresh={() => void fetchAll()}
            onAdd={openCreate}
            selectedCount={selectedIds.size}
            onBulkDelete={() => void onBulkDelete()}
            onBulkInStock={(v) => void onBulkInStock(v)}
            onBulkPublished={(v) => void onBulkPublished(v)}
            onOpenBulkEdit={() => setBulkOpen(true)}
          />
        </div>

        {status.kind !== "idle" ? (
          <div
            className={
              "mx-6 mt-4 rounded-2xl border p-4 text-sm " +
              (status.kind === "ok"
                ? "border-yellow-400/20 bg-yellow-400/10 text-yellow-100/90"
                : "border-red-500/20 bg-red-500/10 text-red-200/90")
            }
          >
            {status.text}
          </div>
        ) : null}

        <div className="mx-6 mt-3 space-y-1.5 text-xs">
          {putTrace ? (
            <p className="font-mono text-zinc-300">
              Последний запрос:{" "}
              <span className="text-yellow-200/90">{putTrace.method}</span> {putTrace.path} → HTTP{" "}
              <span
                className={
                  putTrace.status === 0
                    ? "text-orange-300"
                    : putTrace.status >= 200 && putTrace.status < 300
                      ? "text-green-400"
                      : "text-red-300"
                }
              >
                {putTrace.status === 0 ? "— (нет ответа)" : putTrace.status}
              </span>
              {putTrace.ms > 0 ? <span className="text-zinc-500"> ({putTrace.ms} ms)</span> : null}
            </p>
          ) : (
            <p className="text-zinc-500">
              После смены цены/остатка уходит{" "}
              <span className="rounded bg-white/10 px-1 font-mono text-zinc-300">PUT</span> — статус
              появится здесь и строкой{" "}
              <span className="font-mono text-zinc-400">[admin] … PUT …</span> в консоли (F12 → Console).
            </p>
          )}
          <p className="text-zinc-500">
            Вкладка «Сеть»: включите фильтр <span className="font-mono text-zinc-400">Fetch/XHR</span> (или
            «Все»), найдите запрос к <span className="font-mono text-zinc-400">…/api/admin/products/…</span> —
            в колонке «Метод» будет <span className="font-mono text-zinc-400">PUT</span>.
          </p>
        </div>

        <div className="mt-4 px-6">
          <AdminProductsDataTable
            items={pageItems}
            selectedIds={selectedIds}
            onToggleSelect={(id) => {
              setSelectedIds((prev) => {
                const next = new Set(prev);
                if (next.has(id)) next.delete(id);
                else next.add(id);
                return next;
              });
            }}
            onToggleSelectAllOnPage={(select) => {
              const ids = pageItems.map((p) => p.id);
              setSelectedIds((prev) => {
                const next = new Set(prev);
                if (select) ids.forEach((id) => next.add(id));
                else ids.forEach((id) => next.delete(id));
                return next;
              });
            }}
            onPatch={(id, patch) => patchProduct(id, patch)}
            onEdit={(p) => void openEdit(p)}
            onDuplicate={(p) => void duplicateProduct(p)}
            onDelete={(id) => void remove(id)}
            rowBusyId={rowBusyId}
            patchSavingProductId={patchSavingId}
          />
        </div>

        <AdminProductsPaginationBar
          page={page}
          pageSize={pageSize}
          totalFiltered={filtered.length}
          onPageChange={setPage}
          onPageSizeChange={(n) => {
            setPageSize(n);
            setPage(1);
          }}
          selectedCount={selectedIds.size}
          onClearSelection={() => setSelectedIds(new Set())}
        />

        <AdminProductsBulkDialog
          open={bulkOpen}
          onOpenChange={setBulkOpen}
          selectedCount={selectedIds.size}
          onApply={async (ops) => {
            await handleBulkApply(ops);
          }}
        />

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="border-white/10 bg-black/95 p-0 sm:max-w-3xl">
            <DialogHeader>
              <DialogTitle className="px-6 pt-6 text-zinc-50">
                {isEditing ? "Редактировать товар" : "Добавить товар"}
              </DialogTitle>
            </DialogHeader>

            <div className="max-h-[72vh] overflow-y-auto px-6 pb-6 pr-5">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-zinc-200/90">Название</label>
                  <Input
                    className="mt-2 h-10 rounded-xl border-white/10 bg-black/40 text-zinc-50"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.currentTarget.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-200/90">Бренд</label>
                  <Input
                    className="mt-2 h-10 rounded-xl border-white/10 bg-black/40 text-zinc-50"
                    value={form.brand}
                    onChange={(e) => setForm({ ...form, brand: e.currentTarget.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-200/90">Цена (₽)</label>
                  <Input
                    className="mt-2 h-10 rounded-xl border-white/10 bg-black/40 text-zinc-50"
                    inputMode="numeric"
                    value={String(form.priceRub)}
                    onChange={(e) =>
                      setForm({ ...form, priceRub: parseOptionalInt(e.currentTarget.value) ?? 0 })
                    }
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-200/90">Остаток (шт.)</label>
                  <Input
                    className="mt-2 h-10 rounded-xl border-white/10 bg-black/40 text-zinc-50"
                    inputMode="numeric"
                    value={String(form.stockQty)}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        stockQty: Math.max(0, parseOptionalInt(e.currentTarget.value) ?? 0),
                      })
                    }
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-200/90">Категория</label>
                  <Select
                    value={form.category}
                    onValueChange={(value) =>
                      setForm({
                        ...form,
                        category:
                          value === "thermal-monocular"
                            ? "thermal-monocular"
                            : value === "optical"
                              ? "optical"
                              : value === "collimator"
                                ? "collimator"
                                : value === "other"
                                  ? "other"
                                  : "thermal-scope",
                      })
                    }
                  >
                    <SelectTrigger className="mt-2 h-10 w-full rounded-xl border-white/10 bg-black/40 text-zinc-50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-white/10 bg-black/95">
                      <SelectItem value="thermal-scope">Тепловизионные прицелы</SelectItem>
                      <SelectItem value="thermal-monocular">Тепловизионные монокуляры</SelectItem>
                      <SelectItem value="optical">Оптические</SelectItem>
                      <SelectItem value="collimator">Коллиматорные</SelectItem>
                      <SelectItem value="other">Прочее</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-200/90">Кратность</label>
                  <Input
                    className="mt-2 h-10 rounded-xl border-white/10 bg-black/40 text-zinc-50"
                    placeholder="например: 1-6×"
                    value={form.magnification}
                    onChange={(e) => setForm({ ...form, magnification: e.currentTarget.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-200/90">Диаметр линзы (мм)</label>
                  <Input
                    className="mt-2 h-10 rounded-xl border-white/10 bg-black/40 text-zinc-50"
                    inputMode="numeric"
                    value={String(form.lensDiameterMm)}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        lensDiameterMm: parseOptionalInt(e.currentTarget.value) ?? 0,
                      })
                    }
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-zinc-200/90">
                    ID товара в каталоге (витрина)
                  </label>
                  <Input
                    className="mt-2 h-10 rounded-xl border-white/10 bg-black/40 font-mono text-sm text-zinc-50"
                    placeholder="например: p1, p2 (как в CSV каталога)"
                    value={form.linkedCatalogProductId ?? ""}
                    onChange={(e) => {
                      const v = e.currentTarget.value.trim();
                      setForm({
                        ...form,
                        linkedCatalogProductId: v.length ? v : null,
                      });
                    }}
                  />
                  <p className="mt-1 text-[11px] text-zinc-300/70">
                    Если указать — на странице товара подтянутся описание, характеристики и галерея из
                    админки. Иначе совпадение ищется по slug от названия (менее надёжно).
                  </p>
                </div>

                <div className="sm:col-span-2">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <div className="text-xs font-medium text-zinc-200/90">Фото</div>
                      <div className="mt-1 text-[11px] text-zinc-300/70">
                        {canStorageUpload && isEditing
                          ? "Файлы уходят в Supabase Storage; порядок меняйте кнопками ниже."
                          : "Без Storage — встраивание в JSON (Data URL)."}
                      </div>
                    </div>
                    <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-zinc-50 transition hover:bg-white/10">
                      <ImageUp className="h-4 w-4 text-yellow-100/90" />
                      Загрузить
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        multiple
                        onChange={async (e) => {
                          const files = Array.from(e.currentTarget.files ?? []);
                          if (files.length === 0) return;
                          if (canStorageUpload && isEditing && editingId) {
                            setLoading(true);
                            setStatus({ kind: "idle" });
                            try {
                              const fd = new FormData();
                              for (const f of files) fd.append("file", f);
                              const r = await fetch(
                                `/api/admin/products/${encodeURIComponent(editingId)}/images`,
                                {
                                  method: "POST",
                                  credentials: "include",
                                  body: fd,
                                },
                              );
                              const data = (await r.json()) as {
                                photoDataUrls?: string[];
                                urls?: string[];
                                error?: string;
                              };
                              if (!r.ok) throw new Error(data.error ?? "upload failed");
                              const nextUrls = Array.isArray(data.photoDataUrls)
                                ? data.photoDataUrls
                                : [...form.photoDataUrls, ...(data.urls ?? [])];
                              setForm({ ...form, photoDataUrls: nextUrls });
                              setStatus({ kind: "ok", text: "Фото загружены." });
                              await fetchAll();
                            } catch (err) {
                              setStatus({
                                kind: "error",
                                text: err instanceof Error ? err.message : "Ошибка загрузки",
                              });
                            } finally {
                              setLoading(false);
                            }
                          } else {
                            const urls = await Promise.all(files.map((f) => readFileAsDataUrl(f)));
                            setForm({ ...form, photoDataUrls: [...form.photoDataUrls, ...urls] });
                          }
                          e.currentTarget.value = "";
                        }}
                      />
                    </label>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {form.photoDataUrls.map((u, i) => (
                      <div
                        key={i}
                        className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5"
                      >
                        <div className="relative aspect-[4/3]">
                          <Image src={u} alt="" fill className="object-cover" />
                        </div>

                        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between gap-2 opacity-0 transition group-hover:opacity-100">
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-black/55 text-zinc-50 backdrop-blur transition hover:bg-black/70 disabled:opacity-40"
                              onClick={() => movePhoto(i, -1)}
                              disabled={i === 0}
                              aria-label="Сдвинуть влево"
                              title="Влево"
                            >
                              <ArrowLeft className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-black/55 text-zinc-50 backdrop-blur transition hover:bg-black/70 disabled:opacity-40"
                              onClick={() => movePhoto(i, 1)}
                              disabled={i === form.photoDataUrls.length - 1}
                              aria-label="Сдвинуть вправо"
                              title="Вправо"
                            >
                              <ArrowRight className="h-4 w-4" />
                            </button>
                          </div>

                          <button
                            type="button"
                            className="inline-flex h-9 items-center gap-2 rounded-xl border border-white/10 bg-black/55 px-3 text-xs font-semibold text-zinc-50 backdrop-blur transition hover:bg-black/70"
                            onClick={() => makeCover(i)}
                            disabled={i === 0}
                            aria-label="Сделать обложкой"
                            title="Сделать обложкой"
                          >
                            <Star className="h-4 w-4 text-yellow-200/90" />
                            Обложка
                          </button>
                        </div>

                        <button
                          type="button"
                          className="absolute right-2 top-2 inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-black/55 text-zinc-50 opacity-0 backdrop-blur transition group-hover:opacity-100 hover:bg-black/70"
                          onClick={() =>
                            setForm({
                              ...form,
                              photoDataUrls: form.photoDataUrls.filter((_, idx) => idx !== i),
                            })
                          }
                          aria-label="Удалить фото"
                          title="Удалить"
                        >
                          <Trash2 className="h-4 w-4 text-red-200/90" />
                        </button>
                        {i === 0 ? (
                          <div className="absolute bottom-2 left-2 rounded-full border border-yellow-400/25 bg-yellow-400/15 px-2 py-0.5 text-[10px] font-semibold text-yellow-100/90">
                            Обложка
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>

                  {form.photoDataUrls.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="h-10 rounded-xl border-white/10 bg-white/5 text-zinc-50 hover:bg-white/10"
                        onClick={() => setForm({ ...form, photoDataUrls: [] })}
                      >
                        <Trash2 className="mr-2 h-4 w-4 text-red-300/90" />
                        Удалить все фото
                      </Button>
                    </div>
                  ) : null}
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-zinc-200/90">Описание</label>
                  <Textarea
                    className="mt-2 min-h-24 rounded-xl border-white/10 bg-black/40 text-zinc-50"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.currentTarget.value })}
                    placeholder="SEO-описание, преимущества, комплектация..."
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-zinc-200/90">Характеристики</label>
                  <div className="mt-1 text-[11px] text-zinc-300/70">
                    Формат: одна строка = один пункт. Пример:{" "}
                    <span className="font-mono">Матрица: 640×512</span>
                  </div>
                  <Textarea
                    className="mt-2 min-h-32 rounded-xl border-white/10 bg-black/40 font-mono text-xs text-zinc-50"
                    value={form.specsText}
                    onChange={(e) => setForm({ ...form, specsText: e.currentTarget.value })}
                    placeholder={
                      "Матрица: 640×512\\nЛинза: 35 мм\\nКратность: 1.6–6.4×\\nДальномер: есть"
                    }
                    spellCheck={false}
                  />
                </div>

                <div className="sm:col-span-2 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-zinc-100/85">
                    <span className="font-semibold">В наличии</span>
                    <Checkbox
                      checked={form.inStock}
                      onCheckedChange={() => setForm({ ...form, inStock: !form.inStock })}
                      className="data-[state=checked]:border-yellow-400 data-[state=checked]:bg-yellow-400 data-[state=checked]:text-black"
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-zinc-100/85 sm:col-span-2">
                    <span className="font-semibold">Опубликован на сайте</span>
                    <Checkbox
                      checked={form.published}
                      onCheckedChange={() => setForm({ ...form, published: !form.published })}
                      className="data-[state=checked]:border-yellow-400 data-[state=checked]:bg-yellow-400 data-[state=checked]:text-black"
                    />
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="mt-6 border-t border-white/10 bg-black/60 backdrop-blur">
              <div className="mr-auto text-xs text-zinc-200/65">
                {canSubmit ? "Готово к сохранению" : "Заполните название и бренд"}
              </div>
              <Button
                type="button"
                variant="outline"
                className="rounded-xl border-white/10 bg-white/5 text-zinc-50 hover:bg-white/10"
                onClick={() => setOpen(false)}
              >
                Отмена
              </Button>
              <Button
                type="button"
                className="rounded-xl bg-yellow-400 font-semibold text-black hover:bg-yellow-300 disabled:opacity-60"
                onClick={() => void submit()}
                disabled={!canSubmit || loading}
              >
                {isEditing ? <Pencil className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
                {isEditing ? "Сохранить" : "Создать"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
