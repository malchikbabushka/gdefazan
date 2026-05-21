/** Обрывает зависший fetch (блокировка сети / недоступный API). */
export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init?: RequestInit,
  ms = 12_000,
): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(input, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
}
