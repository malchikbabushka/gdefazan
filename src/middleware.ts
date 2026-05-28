import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseAuthConfigured } from "@/lib/env/supabase";
import { ADMIN_DEMO_COOKIE, isDemoAdminEnabled } from "@/lib/admin-demo";

export async function middleware(request: NextRequest) {
  if (!isSupabaseAuthConfigured()) {
    return NextResponse.next();
  }

  const pathname = request.nextUrl.pathname;
  const isLogin = pathname === "/admin/login";

  try {
    let supabaseResponse = NextResponse.next({ request });

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
            supabaseResponse = NextResponse.next({ request });
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options),
            );
          },
        },
      },
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const demoAdmin =
      isDemoAdminEnabled() && request.cookies.get(ADMIN_DEMO_COOKIE)?.value === "1";

    if (pathname.startsWith("/admin") && !isLogin) {
      if (!user && !demoAdmin) {
        const url = request.nextUrl.clone();
        url.pathname = "/admin/login";
        url.searchParams.set("next", pathname);
        return NextResponse.redirect(url);
      }
    }

    if (isLogin && user) {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }

    return supabaseResponse;
  } catch (e) {
    console.error("[middleware] admin/supabase:", e);
    if (isLogin) {
      return NextResponse.next();
    }
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.searchParams.set("err", "middleware");
    if (pathname.startsWith("/admin")) {
      url.searchParams.set("next", pathname);
    }
    return NextResponse.redirect(url);
  }
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
