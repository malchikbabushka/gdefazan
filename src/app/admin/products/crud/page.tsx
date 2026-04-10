"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
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
import { formatRub, parseOptionalInt } from "@/lib/catalog-logic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type FormState = Omit<AdminProduct, "createdAt" | "updatedAt">;

const EMPTY_FORM: FormState = {
  id: "",
  name: "",
  brand: "",
  priceRub: 0,
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

function CategoryBadge({ category }: { category: AdminProductCategory }) {
  const label =
    category === "thermal-scope"
      ? "Теплоприцел"
      : category === "thermal-monocular"
        ? "Тепломонокуляр"
        : category === "collimator"
          ? "Коллиматор"
          : category === "other"
            ? "Прочее"
          : "Оптика";
  return (
    <Badge className="border border-white/10 bg-white/5 text-zinc-100/80 hover:bg-white/5">
      {label}
    </Badge>
  );
}

export default function AdminProductsCrudPage() {
  const [items, setItems] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ kind: "idle" | "ok" | "error"; text?: string }>({
    kind: "idle",
  });

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const fetchAll = async () => {
    setLoading(true);
    setStatus({ kind: "idle" });
    try {
      const r = await fetch("/api/admin/products?includePhotos=1", { cache: "no-store" });
      const data = (await r.json()) as { products: AdminProduct[] };
      setItems(Array.isArray(data.products) ? data.products : []);
    } catch (e) {
      setStatus({ kind: "error", text: e instanceof Error ? e.message : "Ошибка загрузки" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const isEditing = editingId !== null;

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setOpen(true);
  };

  const openEdit = (p: AdminProduct) => {
    setEditingId(p.id);
    setForm({
      id: p.id,
      name: p.name,
      brand: p.brand,
      priceRub: p.priceRub,
      category: p.category,
      magnification: p.magnification,
      lensDiameterMm: p.lensDiameterMm,
      inStock: p.inStock,
      linkedCatalogProductId:
        typeof p.linkedCatalogProductId === "string" &&
        p.linkedCatalogProductId.trim()
          ? p.linkedCatalogProductId.trim()
          : null,
      description: p.description ?? "",
      specsText: p.specsText ?? "",
      photoDataUrls: Array.isArray(p.photoDataUrls) ? p.photoDataUrls : [],
    });
    setOpen(true);
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
        const r = await fetch(`/api/admin/products/${editingId}`, {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(form),
        });
        if (!r.ok) throw new Error("Не удалось сохранить");
        setStatus({ kind: "ok", text: "Сохранено." });
      } else {
        const r = await fetch("/api/admin/products", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(form),
        });
        if (!r.ok) throw new Error("Не удалось создать");
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
      const r = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
      if (!r.ok) throw new Error("Не удалось удалить");
      setStatus({ kind: "ok", text: "Удалено." });
      await fetchAll();
    } catch (e) {
      setStatus({ kind: "error", text: e instanceof Error ? e.message : "Ошибка" });
    } finally {
      setLoading(false);
    }
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
              Упор на тепловизионные прицелы и монокуляры. Данные идут через API и
              сохраняются в JSON-файл.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-10 rounded-xl border-white/10 bg-white/5 px-4 text-sm font-semibold text-zinc-50 hover:bg-white/10"
              onClick={() => fetchAll()}
              disabled={loading}
            >
              <RefreshCw className="mr-2 h-4 w-4 text-yellow-100/90" />
              Обновить
            </Button>
            <Button
              type="button"
              className="h-10 rounded-xl bg-yellow-400 px-4 text-sm font-semibold text-black hover:bg-yellow-300 disabled:opacity-60"
              onClick={openCreate}
              disabled={loading}
            >
              <Plus className="mr-2 h-4 w-4" />
              Добавить
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6 pt-0">

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

      <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-black/30">
        <Table>
          <TableHeader className="border-b border-white/10 bg-black/40 text-xs uppercase tracking-wide text-zinc-300/60">
            <TableRow className="hover:bg-transparent">
              <TableHead className="px-4">Фото</TableHead>
              <TableHead className="px-4">Название</TableHead>
              <TableHead className="px-4">Бренд</TableHead>
              <TableHead className="px-4">Категория</TableHead>
              <TableHead className="px-4">Кратность</TableHead>
              <TableHead className="px-4">Линза</TableHead>
              <TableHead className="px-4">Цена</TableHead>
              <TableHead className="px-4">Наличие</TableHead>
              <TableHead className="px-4">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-white/10">
            {items.map((p) => (
              <TableRow key={p.id} className="hover:bg-white/5">
                <TableCell className="px-4 py-3">
                  <div className="relative h-10 w-16 overflow-hidden rounded-xl border border-white/10 bg-white/5">
                    {p.photoDataUrls?.[0] ? (
                      <Image src={p.photoDataUrls[0]} alt={p.name} fill className="object-cover" />
                    ) : null}
                  </div>
                </TableCell>
                <TableCell className="px-4 py-3">
                  <div className="font-semibold text-zinc-50">{p.name}</div>
                </TableCell>
                <TableCell className="px-4 py-3 text-zinc-200/80">{p.brand}</TableCell>
                <TableCell className="px-4 py-3">
                  <CategoryBadge category={p.category} />
                </TableCell>
                <TableCell className="px-4 py-3 text-zinc-200/80">{p.magnification}</TableCell>
                <TableCell className="px-4 py-3 text-zinc-200/80">
                  {p.lensDiameterMm ? `${p.lensDiameterMm} мм` : "—"}
                </TableCell>
                <TableCell className="px-4 py-3 font-semibold text-yellow-100/90">
                  {formatRub(p.priceRub)}
                </TableCell>
                <TableCell className="px-4 py-3">
                  <Badge
                    className={
                      "border " +
                      (p.inStock
                        ? "border-yellow-400/20 bg-yellow-400/10 text-yellow-100/90 hover:bg-yellow-400/10"
                        : "border-white/10 bg-white/5 text-zinc-200/70 hover:bg-white/5")
                    }
                  >
                    {p.inStock ? "в наличии" : "нет"}
                  </Badge>
                </TableCell>
                <TableCell className="px-4 py-3">
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="h-9 rounded-xl border-white/10 bg-white/5 px-3 text-xs font-semibold text-zinc-50 hover:bg-white/10"
                      onClick={() => openEdit(p)}
                    >
                      <Pencil className="mr-2 h-4 w-4 text-yellow-100/90" />
                      Ред.
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-9 rounded-xl border-white/10 bg-white/5 px-3 text-xs font-semibold text-zinc-50 hover:bg-white/10"
                      onClick={() => remove(p.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4 text-red-300/90" />
                      Удал.
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {items.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={9} className="px-4 py-10 text-center text-sm text-zinc-200/70">
                  Нет товаров. Нажмите «Добавить».
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>

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
                    Сохраняется как Data URL в JSON (демо).
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
                      const urls = await Promise.all(files.map((f) => readFileAsDataUrl(f)));
                      setForm({ ...form, photoDataUrls: [...form.photoDataUrls, ...urls] });
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
                Формат: одна строка = один пункт. Пример: <span className="font-mono">Матрица: 640×512</span>
              </div>
              <Textarea
                className="mt-2 min-h-32 rounded-xl border-white/10 bg-black/40 font-mono text-xs text-zinc-50"
                value={form.specsText}
                onChange={(e) => setForm({ ...form, specsText: e.currentTarget.value })}
                placeholder={"Матрица: 640×512\\nЛинза: 35 мм\\nКратность: 1.6–6.4×\\nДальномер: есть"}
                spellCheck={false}
              />
            </div>

            <div className="sm:col-span-2">
              <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-zinc-100/85">
                <span className="font-semibold">В наличии</span>
                <Checkbox
                  checked={form.inStock}
                  onCheckedChange={() => setForm({ ...form, inStock: !form.inStock })}
                  className="data-[state=checked]:border-yellow-400 data-[state=checked]:bg-yellow-400 data-[state=checked]:text-black"
                />
              </div>
            </div>
          </div>
          </div>

          <DialogFooter className="sticky bottom-0 mt-0 border-t border-white/10 bg-black/92 backdrop-blur">
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
              onClick={submit}
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

