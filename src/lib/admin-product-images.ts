import type { AdminProduct } from "@/lib/admin-types";

/** Картинки только через наш API — не грузим *.supabase.co из браузера (блокируется без VPN). */
export function adminProductPhotoUrls(
  a: AdminProduct,
  max = 4,
): string[] {
  const publicList = Array.isArray(a.photoDataUrls)
    ? a.photoDataUrls.filter((u) => typeof u === "string" && u.length > 0)
    : [];
  const count =
    typeof a.photoCount === "number" && Number.isFinite(a.photoCount)
      ? a.photoCount
      : publicList.length;
  if (count <= 0 && publicList.length === 0) return [];
  const cap = Math.min(Math.max(count, publicList.length), max);
  return Array.from(
    { length: cap },
    (_, i) =>
      `/api/storefront/products/${encodeURIComponent(a.id)}/photo?index=${i}`,
  );
}
