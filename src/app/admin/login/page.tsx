import Link from "next/link";
import { Suspense } from "react";
import { LoginForm } from "./LoginForm";

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-black/50 p-8 shadow-xl">
        <h1 className="text-center text-xl font-semibold text-zinc-50">Вход в админку</h1>
        <p className="mt-2 text-center text-sm text-zinc-400">
          Email и пароль из Supabase Auth. Локально без Supabase вход не нужен.
        </p>
        <div className="mt-8">
          <Suspense fallback={<div className="text-center text-sm text-zinc-400">Загрузка…</div>}>
            <LoginForm />
          </Suspense>
        </div>
        <p className="mt-6 text-center text-xs text-zinc-500">
          <Link href="/" className="text-yellow-200/80 underline-offset-4 hover:underline">
            На сайт
          </Link>
        </p>
      </div>
    </div>
  );
}
