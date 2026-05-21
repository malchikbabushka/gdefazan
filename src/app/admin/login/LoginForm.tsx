"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { isSupabaseAuthConfigured } from "@/lib/env/supabase";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/admin/dashboard";
  const middlewareErr = searchParams.get("err");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isSupabaseAuthConfigured()) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm text-zinc-300">
          Переменные Supabase не заданы — используется демо-режим с файлом{" "}
          <span className="font-mono text-zinc-200">data/admin-db.json</span>.
        </p>
        <Button
          type="button"
          className="h-11 w-full rounded-xl bg-yellow-400 font-semibold text-black hover:bg-yellow-300"
          onClick={() => router.replace(next.startsWith("/admin") ? next : "/admin/dashboard")}
        >
          Перейти в админку
        </Button>
      </div>
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const client = createSupabaseBrowserClient();
      const { error: signErr } = await client.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signErr) {
        setError(signErr.message);
        return;
      }
      router.replace(next.startsWith("/admin") ? next : "/admin/dashboard");
      router.refresh();
    } catch {
      setError("Не удалось выполнить вход");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {middlewareErr === "middleware" ? (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-100/95">
          Не удалось связаться с Supabase в middleware (часто из‑за неверного URL/ключа или сети).
          Проверьте <span className="font-mono">NEXT_PUBLIC_SUPABASE_URL</span> и{" "}
          <span className="font-mono">NEXT_PUBLIC_SUPABASE_ANON_KEY</span> в{" "}
          <span className="font-mono">.env.local</span>, перезапустите{" "}
          <span className="font-mono">npm run dev</span>. Для локальной работы без облака временно
          уберите эти переменные — тогда админка читает{" "}
          <span className="font-mono">data/admin-db.json</span>.
        </div>
      ) : null}
      {error ? (
        <div className="rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-2 text-sm text-red-200/90">
          {error}
        </div>
      ) : null}
      <div>
        <label className="text-xs font-medium text-zinc-400">Email</label>
        <Input
          type="email"
          autoComplete="email"
          required
          className="mt-1.5 h-11 rounded-xl border-white/10 bg-black/40 text-zinc-50"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div>
        <label className="text-xs font-medium text-zinc-400">Пароль</label>
        <Input
          type="password"
          autoComplete="current-password"
          required
          className="mt-1.5 h-11 rounded-xl border-white/10 bg-black/40 text-zinc-50"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <Button
        type="submit"
        disabled={loading}
        className="h-11 w-full rounded-xl bg-yellow-400 font-semibold text-black hover:bg-yellow-300 disabled:opacity-60"
      >
        {loading ? "Вход…" : "Войти"}
      </Button>
    </form>
  );
}
