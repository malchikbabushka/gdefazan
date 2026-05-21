import { NextResponse } from "next/server";
import { repoGetSiteConfig } from "@/lib/server/admin-repository";
import { DEFAULT_SITE_CONFIG } from "@/lib/site-config";
import { withTimeout } from "@/lib/server/with-timeout";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const config = await withTimeout(repoGetSiteConfig(), 8_000, "repoGetSiteConfig");
    return NextResponse.json(
      { config },
      {
        headers: {
          // Public storefront config; cache at CDN and allow SWR.
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=600",
        },
      },
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { config: DEFAULT_SITE_CONFIG },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=600",
        },
      },
    );
  }
}
