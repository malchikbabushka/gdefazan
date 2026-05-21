"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { Check, Copy, Loader2, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import type { AdminProduct } from "@/lib/admin-types";
import { parseOptionalInt } from "@/lib/catalog-logic";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CategoryBadge } from "./category-badge";

function thumbSrc(p: AdminProduct): string | null {
  const first = p.photoDataUrls?.[0];
  if (
    first &&
    (first.startsWith("http://") || first.startsWith("https://") || first.startsWith("/"))
  ) {
    return first;
  }
  const n = typeof p.photoCount === "number" ? p.photoCount : p.photoDataUrls?.length ?? 0;
  if (n > 0) return `/api/admin/products/${p.id}/photo?index=0`;
  return null;
}

function InlineNumber({
  productId,
  value,
  onCommit,
  className,
  disabled,
  withApplyButton,
}: {
  productId: string;
  value: number;
  onCommit: (id: string, next: number) => boolean | Promise<boolean>;
  className?: string;
  disabled?: boolean;
  /** Кнопка ✓ — явный PUT без зависимости от blur (удобно при открытом DevTools). */
  withApplyButton?: boolean;
}) {
  const [v, setV] = useState(String(value));
  useEffect(() => {
    setV(String(value));
  }, [productId, value]);

  const runCommit = useCallback(async () => {
    const n = parseOptionalInt(v) ?? value;
    const next = Math.max(0, n);
    if (next === value) return true;
    const ok = await onCommit(productId, next);
    if (!ok) setV(String(value));
    return ok;
  }, [v, value, productId, onCommit]);

  const input = (
    <Input
      disabled={disabled}
      inputMode="numeric"
      className={className}
      value={v}
      onChange={(e) => setV(e.target.value)}
      onBlur={() => {
        void runCommit();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
      }}
    />
  );

  if (!withApplyButton) {
    return input;
  }

  return (
    <div className="flex min-w-0 items-center gap-1">
      {input}
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        className="h-8 w-8 shrink-0 border-white/15 bg-black/40 text-zinc-200 hover:bg-white/10"
        disabled={disabled}
        title="Сохранить (отправит PUT)"
        aria-label="Сохранить значение"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => void runCommit()}
      >
        <Check className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

type Props = {
  items: AdminProduct[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAllOnPage: (select: boolean) => void;
  /** true — сохранено; false — откатить локальное значение в ячейке. */
  onPatch: (id: string, patch: Partial<AdminProduct>) => Promise<boolean>;
  onEdit: (p: AdminProduct) => void;
  onDuplicate: (p: AdminProduct) => void;
  onDelete: (id: string) => void;
  rowBusyId: string | null;
  patchSavingProductId: string | null;
};

export function AdminProductsDataTable({
  items,
  selectedIds,
  onToggleSelect,
  onToggleSelectAllOnPage,
  onPatch,
  onEdit,
  onDuplicate,
  onDelete,
  rowBusyId,
  patchSavingProductId,
}: Props) {
  const pageIds = items.map((p) => p.id);
  const allSelected =
    pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));
  const someSelected = pageIds.some((id) => selectedIds.has(id));

  return (
    <div className="overflow-x-auto rounded-xl border border-white/10 bg-black/30">
      <Table>
        <TableHeader className="border-b border-white/10 bg-black/50">
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-10 px-2">
              <Checkbox
                checked={allSelected}
                className={!allSelected && someSelected ? "opacity-60" : ""}
                onCheckedChange={(c) => onToggleSelectAllOnPage(c === true)}
                aria-label="Выбрать все на странице"
              />
            </TableHead>
            <TableHead className="min-w-[56px] px-2">Фото</TableHead>
            <TableHead className="min-w-[180px] px-2">Название</TableHead>
            <TableHead className="min-w-[100px] px-2">Бренд</TableHead>
            <TableHead className="min-w-[120px] px-2">Категория</TableHead>
            <TableHead className="min-w-[100px] px-2">Цена ₽</TableHead>
            <TableHead className="min-w-[80px] px-2">Остаток</TableHead>
            <TableHead className="min-w-[70px] px-2 text-center">В наличии</TableHead>
            <TableHead className="min-w-[70px] px-2 text-center">Сайт</TableHead>
            <TableHead className="w-12 px-2" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((p) => {
            const busy = rowBusyId === p.id;
            const patchSaving = patchSavingProductId === p.id;
            const src = thumbSrc(p);
            return (
              <TableRow key={p.id} className="border-white/5 hover:bg-white/[0.04]">
                <TableCell className="px-2 py-2">
                  <Checkbox
                    checked={selectedIds.has(p.id)}
                    onCheckedChange={() => onToggleSelect(p.id)}
                    aria-label={`Выбрать ${p.name}`}
                  />
                </TableCell>
                <TableCell className="px-2 py-2">
                  <div className="relative h-11 w-16 overflow-hidden rounded-lg border border-white/10 bg-white/5">
                    {src ? (
                      <Image
                        src={src}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="64px"
                        unoptimized={src.startsWith("/api/") || src.includes("supabase")}
                      />
                    ) : null}
                  </div>
                </TableCell>
                <TableCell className="max-w-[220px] px-2 py-2">
                  <div className="truncate font-medium text-zinc-100" title={p.name}>
                    {p.name}
                  </div>
                  <div className="truncate font-mono text-[10px] text-zinc-500">{p.id}</div>
                </TableCell>
                <TableCell className="px-2 py-2 text-sm text-zinc-300">{p.brand}</TableCell>
                <TableCell className="px-2 py-2">
                  <CategoryBadge category={p.category} />
                </TableCell>
                <TableCell className="px-2 py-2">
                  <div className="flex items-center gap-1.5">
                    <InlineNumber
                      productId={p.id}
                      value={p.priceRub}
                      disabled={patchSaving}
                      withApplyButton
                      className="h-8 w-[100px] rounded-lg border-white/10 bg-black/50 text-sm"
                      onCommit={(id, next) => onPatch(id, { priceRub: next })}
                    />
                    {patchSaving ? (
                      <Loader2
                        className="h-4 w-4 shrink-0 animate-spin text-yellow-200/85"
                        aria-hidden
                      />
                    ) : null}
                  </div>
                </TableCell>
                <TableCell className="px-2 py-2">
                  <InlineNumber
                    productId={p.id}
                    value={p.stockQty}
                    disabled={patchSaving}
                    withApplyButton
                    className="h-8 w-[72px] rounded-lg border-white/10 bg-black/50 text-sm"
                    onCommit={(id, next) => onPatch(id, { stockQty: next })}
                  />
                </TableCell>
                <TableCell className="px-2 py-2 text-center">
                  <div className="flex justify-center">
                    <Switch
                      checked={p.inStock}
                      disabled={busy}
                      onCheckedChange={(c) => void onPatch(p.id, { inStock: c === true })}
                    />
                  </div>
                </TableCell>
                <TableCell className="px-2 py-2 text-center">
                  <div className="flex justify-center">
                    <Switch
                      checked={p.published}
                      disabled={busy}
                      onCheckedChange={(c) => void onPatch(p.id, { published: c === true })}
                    />
                  </div>
                </TableCell>
                <TableCell className="px-2 py-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      disabled={busy}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 outline-none hover:bg-white/10 hover:text-zinc-100 disabled:pointer-events-none disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-yellow-400/30"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="min-w-[180px] border-white/10 bg-zinc-950 text-zinc-100"
                    >
                      <DropdownMenuItem
                        className="cursor-pointer"
                        onClick={() => onEdit(p)}
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Полная карточка
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="cursor-pointer"
                        onClick={() => onDuplicate(p)}
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        Дублировать
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="cursor-pointer text-red-300 focus:text-red-200"
                        onClick={() => onDelete(p.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Удалить
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
          {items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={10} className="py-12 text-center text-sm text-zinc-500">
                Нет строк по текущим фильтрам.
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
    </div>
  );
}
