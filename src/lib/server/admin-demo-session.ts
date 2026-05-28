import { cookies } from "next/headers";
import { ADMIN_DEMO_COOKIE, isDemoAdminEnabled } from "@/lib/admin-demo";

export async function hasDemoAdminCookie() {
  if (!isDemoAdminEnabled()) return false;
  const jar = await cookies();
  return jar.get(ADMIN_DEMO_COOKIE)?.value === "1";
}
