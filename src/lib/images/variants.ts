export function deriveSupabaseImageVariant(url: string, width: 320 | 960): string {
  // Only for our own storage naming convention:
  // .../<uuid>_w960.webp  -> .../<uuid>_w320.webp
  if (!url) return url;
  return url.replace(/_w(320|960)\.webp($|\?)/, `_w${width}.webp$2`);
}

