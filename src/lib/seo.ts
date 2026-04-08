export function getSiteUrl() {
  const env =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim() ||
    process.env.VERCEL_URL?.trim();

  if (!env) return "http://localhost:3000";
  if (env.startsWith("http://") || env.startsWith("https://")) return env;
  return `https://${env}`;
}

export function absoluteUrl(pathname: string) {
  return new URL(pathname, getSiteUrl()).toString();
}

