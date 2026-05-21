# Supabase для Thermal Shop

Без переменных окружения приложение читает `data/admin-db.json` (демо).  
С **Supabase** админка, заказы, CMS и **загрузка фото** работают из облака — это нужно для **Vercel** и продакшена.

## Автонастройка (без ручного SQL в браузере)

1. В Supabase: **Project Settings → API** — скопируйте URL, **anon** и **service_role** в `.env.local`.  
2. **Project Settings → Database → Connection string** — режим **URI**, лучше **Direct connection** (порт **5432**). Скопируйте строку в `.env.local` как `DATABASE_URL=...` (пароль уже внутри URI).  
3. По желанию в `.env.local`:  
   `BOOTSTRAP_ADMIN_EMAIL=` и `BOOTSTRAP_ADMIN_PASSWORD=` — скрипт создаст пользователя для `/admin/login`.  
4. В корне проекта:

```bash
npm run supabase:bootstrap
```

Скрипт применяет [`complete_setup.sql`](./complete_setup.sql), создаёт бакет **`product-images`** (public) и опционально пользователя Auth.

---

## 1. Проект в Supabase

1. Зайдите на [supabase.com](https://supabase.com) → **New project** (регион, пароль БД).
2. Дождитесь статуса **Healthy**.

## 2. Таблицы (SQL)

**Вариант A — один файл (пустая БД)**  
В **SQL Editor** → New query → вставьте содержимое [`complete_setup.sql`](./complete_setup.sql) → **Run**.

**Вариант B — миграции по порядку**  
Выполните в SQL Editor по очереди:

1. [`migrations/20260210120000_initial.sql`](./migrations/20260210120000_initial.sql)  
2. [`migrations/20260211120000_admin_products_stock_published.sql`](./migrations/20260211120000_admin_products_stock_published.sql)  
   (на новой БД после шага 1 колонки уже могут быть — скрипт безопасный, `IF NOT EXISTS`.)

**Вариант C — Supabase CLI** (локально, с привязкой к проекту):

```bash
npx supabase login
npx supabase link --project-ref <ваш-project-ref>
npx supabase db push
```

`project-ref` смотрите в **Project Settings → General → Reference ID**.

## 3. Storage (картинки товаров)

1. **Storage** → **New bucket**  
2. Имя: **`product-images`** (как в коде: `PRODUCT_IMAGES_BUCKET`).  
3. Включите **Public bucket** (витрина и админка открывают URL вида  
   `https://<ref>.supabase.co/storage/v1/object/public/product-images/...`).

Загрузка в бакет идёт с сервера через **service role** — отдельные политики Storage для anon не обязательны.

## 4. Auth (вход в админку)

1. **Authentication** → **Providers** → **Email** — включён по умолчанию.  
2. **Authentication** → **Users** → **Add user** — email + пароль (это и есть логин в `/admin/login`).  
3. При необходимости отключите **Confirm email** для теста: **Authentication** → **Providers** → **Email** → настройки подтверждения.

Пока заданы `NEXT_PUBLIC_SUPABASE_URL` и `NEXT_PUBLIC_SUPABASE_ANON_KEY`, **middleware** пускает в `/admin/*` только залогиненных пользователей.

## 5. Переменные окружения

Скопируйте из **Project Settings → API**:

| Переменная | Где взять |
|------------|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon **public** |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role **secret** (только сервер, не в клиент) |

Локально — в **`.env.local`**, на **Vercel** — **Settings → Environment Variables** (Production + Preview).

Корневой **[`../.env.example`](../.env.example)** содержит шаблон имён переменных.

## 6. Перенос данных из `admin-db.json` (опционально)

После настройки env:

```bash
npm run migrate:admin
```

Нужны `NEXT_PUBLIC_SUPABASE_URL` и `SUPABASE_SERVICE_ROLE_KEY`. Скрипт: [`../scripts/migrate-admin-db.ts`](../scripts/migrate-admin-db.ts).

## 7. Проверка

1. `npm run dev`  
2. Откройте `/admin/login` → войдите пользователем из п.4.  
3. `/admin/products/crud` — правки цен должны сохраняться (в БД, не в JSON).

## Файлы в этой папке

| Файл | Назначение |
|------|------------|
| `config.toml` | Конфиг CLI (`supabase start` / `db push`) |
| `migrations/*.sql` | Версионируемая схема |
| `complete_setup.sql` | Один проход для SQL Editor |
| `seed.sql` | Локальный сид после `db reset` (по желанию) |
