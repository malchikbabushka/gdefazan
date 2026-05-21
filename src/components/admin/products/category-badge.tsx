import type { AdminProductCategory } from "@/lib/admin-types";
import { Badge } from "@/components/ui/badge";

export function CategoryBadge({ category }: { category: AdminProductCategory }) {
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
