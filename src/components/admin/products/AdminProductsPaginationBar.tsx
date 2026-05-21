"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Props = {
  page: number;
  pageSize: number;
  totalFiltered: number;
  onPageChange: (p: number) => void;
  onPageSizeChange: (n: number) => void;
  selectedCount: number;
  onClearSelection: () => void;
};

export function AdminProductsPaginationBar({
  page,
  pageSize,
  totalFiltered,
  onPageChange,
  onPageSizeChange,
  selectedCount,
  onClearSelection,
}: Props) {
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
  const from = totalFiltered === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalFiltered);

  return (
    <div className="flex flex-col gap-3 border-t border-white/10 bg-black/40 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-300">
        {selectedCount > 0 ? (
          <>
            <span>
              Выбрано: <span className="font-semibold text-zinc-100">{selectedCount}</span> из{" "}
              {totalFiltered}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 text-xs text-yellow-200/90 hover:bg-white/10"
              onClick={onClearSelection}
            >
              Снять выделение
            </Button>
          </>
        ) : (
          <span>Всего в выборке: {totalFiltered}</span>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <span className="hidden sm:inline">Строк:</span>
          <Select
            value={String(pageSize)}
            onValueChange={(v) => onPageSizeChange(Number(v) || 25)}
          >
            <SelectTrigger className="h-8 w-[88px] rounded-lg border-white/10 bg-black/50 text-xs text-zinc-100">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-white/10 bg-zinc-950">
              {[10, 25, 50, 100].map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="text-xs text-zinc-400">
          {from}–{to} из {totalFiltered}
        </div>
        <div className="flex gap-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 border-white/10 bg-white/5 text-xs"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            Назад
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 border-white/10 bg-white/5 text-xs"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            Вперёд
          </Button>
        </div>
      </div>
    </div>
  );
}
