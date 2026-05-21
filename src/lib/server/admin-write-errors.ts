/** Запись в data/admin-db.json на read-only ФС (Vercel и т.п.). */
export class AdminDemoFsReadOnlyError extends Error {
  readonly clientMessage =
    "Файловая система только для чтения (например Vercel). Задайте в Production: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY (*.supabase.co), затем Redeploy.";

  constructor() {
    super("Admin DB write blocked (read-only filesystem)");
    this.name = "AdminDemoFsReadOnlyError";
  }
}

export function isFsReadOnlyErrno(code: string | undefined): boolean {
  return code === "EROFS" || code === "EACCES" || code === "EPERM";
}

/** Короткое сообщение для UI; отсекаем длинный мусор и похожее на JWT. */
export function safeClientErrorMessage(e: unknown): string | undefined {
  if (!e || typeof e !== "object") return undefined;
  const raw = (e as { message?: unknown }).message;
  const m = typeof raw === "string" ? raw.trim() : "";
  if (!m || m.length > 400) return undefined;
  if (/eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_.-]+/.test(m)) return undefined;
  return m;
}
