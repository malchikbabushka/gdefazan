/** Без next/headers — безопасно для middleware. */
export const ADMIN_DEMO_COOKIE = "admin_demo";

export function isDemoAdminEnabled() {
  return process.env.ENABLE_DEMO_ADMIN?.trim() === "1";
}
