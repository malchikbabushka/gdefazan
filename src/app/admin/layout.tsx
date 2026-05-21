import type { Metadata } from "next";
import { headers } from "next/headers";
import { AdminChrome } from "./AdminChrome";
import { isSupabaseAuthConfigured, isSupabaseConfigured } from "@/lib/env/supabase";

export const metadata: Metadata = {
  title: "Admin",
  robots: {
    index: false,
    follow: false,
  },
};

/** Читаем env на сервере на каждый запрос — не зависит от устаревшего клиентского инлайна NEXT_PUBLIC_*. */
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await headers();
  const authConfigured = isSupabaseAuthConfigured();
  const dbConfigured = isSupabaseConfigured();
  const onVercel = Boolean(process.env.VERCEL);
  return (
    <AdminChrome
      authConfigured={authConfigured}
      dbConfigured={dbConfigured}
      onVercel={onVercel}
    >
      {children}
    </AdminChrome>
  );
}
