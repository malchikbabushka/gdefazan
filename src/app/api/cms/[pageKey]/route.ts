import { NextResponse } from "next/server";
import type { PageKey } from "@/lib/pages-store";
import { repoGetCmsPage } from "@/lib/server/admin-repository";

const KEYS: PageKey[] = ["warranty", "shipping-payment", "brands", "catalog", "home"];

type Ctx = { params: Promise<{ pageKey: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { pageKey } = await ctx.params;
  if (!KEYS.includes(pageKey as PageKey)) {
    return NextResponse.json({ error: "unknown page" }, { status: 404 });
  }
  try {
    const content = await repoGetCmsPage(pageKey as PageKey);
    return NextResponse.json(
      { pageKey, content },
      {
        headers: {
          // Public CMS content; cache at CDN with SWR.
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      },
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "failed to load page" }, { status: 500 });
  }
}
