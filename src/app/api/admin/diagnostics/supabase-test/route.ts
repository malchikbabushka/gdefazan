import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isSupabaseAuthConfigured, isSupabaseConfigured } from "@/lib/env/supabase";

export const dynamic = "force-dynamic";

/** Проверка ключей Supabase с сервера (без вывода секретов). Откройте в браузере после правки .env. */
export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? "";

  const hostOk = (() => {
    try {
      const h = new URL(url).hostname;
      return h.endsWith(".supabase.co");
    } catch {
      return false;
    }
  })();

  const out: Record<string, unknown> = {
    urlSet: url.length > 0,
    anonSet: anon.length > 0,
    serviceSet: service.length > 0,
    hostIsSupabaseCo: hostOk,
    serverAuthConfigured: isSupabaseAuthConfigured(),
    serverDbConfigured: isSupabaseConfigured(),
    anonSelect: null as string | null,
    serviceSelect: null as string | null,
    publishedProductCount: 0,
    hint: null as string | null,
  };

  if (!url || !anon) {
    out.hint = "Задайте NEXT_PUBLIC_SUPABASE_URL и NEXT_PUBLIC_SUPABASE_ANON_KEY в .env.production, затем pm2 restart.";
    return NextResponse.json(out);
  }

  if (!hostOk) {
    out.hint = "URL должен быть https://xxxx.supabase.co (не .com).";
    return NextResponse.json(out);
  }

  try {
    const anonClient = createClient(url, anon, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const anonRes = await anonClient
      .from("admin_products")
      .select("id", { count: "exact", head: true })
      .eq("published", true);
    if (anonRes.error) {
      out.anonSelect = anonRes.error.message;
    } else {
      out.anonSelect = "ok";
      out.publishedProductCount = anonRes.count ?? 0;
    }
  } catch (e) {
    out.anonSelect = e instanceof Error ? e.message : "error";
  }

  if (service) {
    try {
      const svc = createClient(url, service, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const svcRes = await svc.from("admin_products").select("id").limit(1);
      out.serviceSelect = svcRes.error ? svcRes.error.message : "ok";
    } catch (e) {
      out.serviceSelect = e instanceof Error ? e.message : "error";
    }
  }

  if (out.anonSelect !== "ok" && out.serviceSelect !== "ok") {
    out.hint =
      "Оба ключа не работают — скопируйте anon и service_role заново из Supabase → Settings → API в .env.production.";
  } else if (out.anonSelect === "ok" && (out.publishedProductCount as number) === 0) {
    out.hint = "Ключи ок, но опубликованных товаров 0 — включите published в админке / Supabase.";
  } else if (out.anonSelect === "ok") {
    out.hint = "Витрина должна работать. Откройте /api/storefront/products и главную с Ctrl+F5.";
  }

  return NextResponse.json(out, {
    headers: { "Cache-Control": "no-store" },
  });
}
