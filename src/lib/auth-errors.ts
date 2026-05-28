/** Понятные сообщения для типичных ошибок Supabase Auth. */
export function humanizeAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid api key")) {
    return "Неверный ключ Supabase (anon). Проверьте NEXT_PUBLIC_SUPABASE_ANON_KEY и URL *.supabase.co на сервере, затем перезапустите приложение.";
  }
  if (m.includes("invalid login credentials") || m.includes("invalid credentials")) {
    return "Неверный email или пароль.";
  }
  if (m.includes("email not confirmed")) {
    return "Email не подтверждён. Подтвердите пользователя в Supabase → Authentication.";
  }
  if (m.includes("fetch failed") || m.includes("network")) {
    return "Не удалось связаться с Supabase. Проверьте URL проекта и доступность сети с сервера.";
  }
  return message;
}
