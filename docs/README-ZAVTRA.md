# gdefazan.ru — handoff (продолжить с этого места)

**Обновлено:** 2026-05-22 (вечер)  
**Репозиторий:** https://github.com/malchikbabushka/gdefazan  
**Локально:** `C:\Users\2\Documents\thermal-shop`

---

## Текущий статус одной строкой

**Сайт https://www.gdefazan.ru открывается (HTTPS, production), но карточек товаров нет** — в логах **`Invalid API key`** (неверные ключи Supabase в `.env.production` на сервере).

---

## Что уже сделано

| Что | Статус |
|-----|--------|
| VPS Selectel **Magdalena**, Ubuntu 24.04 | ✅ |
| IP **`135.181.139.208`** (не `135.106.139.208`) | ✅ |
| DNS → VPS, SSL Let's Encrypt (~до 19.08.2026) | ✅ |
| Node **22** (NodeSource), каталог `/var/www/gdefazan` | ✅ |
| **`npm run build`** production (после фиксов TypeScript / storefront route) | ✅ |
| PM2 **`NODE_ENV=production`**, `Ready on port 3000` | ✅ |
| Nginx + certbot | ✅ |
| GitHub: storefront API, SSR каталога в layout, карусель, `deploy/` | ✅ (ветка `main`) |
| Спринтхост | не нужен |

---

## Главная проблема сейчас (блокер)

В `pm2 logs gdefazan --err`:

```text
Invalid API key
hint: Double check your Supabase `anon` or `service_role` API key.
```

`curl` отдаёт `{"products":[]}` — не «нет товаров в базе», а **сервер не может авторизоваться в Supabase**.

Переменные **заданы** (`/api/admin/diagnostics/env` → все `true`), но **значения неверные** (перепутаны anon/service_role, обрезка при вставке, `.com` вместо `.co`, старый ключ).

**Сборку заново не нужно** — только исправить `.env.production` и `pm2 restart`.

---

## План при возврате к проекту (по порядку)

### Шаг 1 — починить Supabase keys (15 мин)

1. Supabase → **Settings → API** (или скопировать из `.env.local` на ПК).
2. На сервере переписать файл с нуля:

```bash
cd /var/www/gdefazan
nano .env.production
```

```env
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0

NEXT_PUBLIC_SUPABASE_URL=https://ВАШ_ПРОЕКТ.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

NEXT_PUBLIC_SITE_URL=https://www.gdefazan.ru
```

- URL только **`*.supabase.co`**
- **`SUPABASE_SERVICE_ROLE_KEY`** = ключ **service_role** (secret), не anon
- без кавычек, без пробелов в конце строк

3. Проверка на сервере:

```bash
set -a && source .env.production && set +a
node -e "const { createClient } = require('@supabase/supabase-js');
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
sb.from('admin_products').select('id').limit(2).then(({ data, error }) => {
  if (error) { console.error('FAIL:', error.message); process.exit(1); }
  console.log('OK, rows:', data?.length ?? 0);
});"
```

Ожидается: **`OK, rows: 1`** (или больше).

4. Перезапуск:

```bash
pm2 delete gdefazan
pm2 start deploy/ecosystem.config.cjs
pm2 save
```

5. Проверка:

```bash
curl -s http://127.0.0.1:3000/api/storefront/products
pm2 logs gdefazan --err --lines 5
```

Должны быть товары в JSON, **без** `Invalid API key`.

### Шаг 2 — подтянуть последний код (если не делали после 9ba8b24)

```bash
cd /var/www/gdefazan
git pull
export NODE_OPTIONS=--max-old-space-size=1400
npm run build
pm2 restart gdefazan
```

Коммиты на GitHub (уже запушены с ПК):

- `8c926ec` — fix storefront `dynamic` re-export (Next 16)
- `0f7c8f1` — fix TypeScript `initialCatalog` в layout
- `9ba8b24` — устойчивый `repoListProducts` + ошибка в API

### Шаг 3 — проверка витрины

- https://www.gdefazan.ru — **Ctrl+F5**, блок «ЛИДЕРЫ ПРОДАЖ»
- Нет `webpack-hmr` в Console (только production)
- https://www.gdefazan.ru/api/storefront/products — JSON с товарами
- Карусель, кнопки каталога
- Фото: Supabase → `product_images`, админка `/admin`

### Шаг 4 — наполнить каталог

В базе было **~2 товара** (Sytong, Kestrel). Остальное — админка или импорт.

### Шаг 5 — опционально

- [ ] `pm2 startup` + `pm2 save` (автозапуск)
- [ ] swap 2G на VPS если build снова долгий: `fallocate -l 2G /swapfile` …
- [ ] REG.RU: A `@` и `www` → `135.181.139.208`

---

## Последние действия в сессии (хронология)

1. Деплой на Selectel: Node 22, PM2, nginx, SSL — сайт открылся.
2. Сначала PM2 без `NODE_ENV=production` → dev-режим, `webpack-hmr`, кнопки не работали.
3. Переключили на production → ошибка **нет `.next` build`** → долгий `npm run build`.
4. Ошибки build: re-export `dynamic` → исправлено; TypeScript `never[]` в layout → исправлено.
5. Push на GitHub: убрали случайные `next-build.tgz` (1.68 GB).
6. Добавили `/api/storefront/products` (без `admin` в URL для AdBlock), SSR каталога, фикс карусели.
7. Сборка production прошла, PM2 `Ready port=3000 production`.
8. Карточек нет: API `products:[]`, в логах **`Invalid API key`** — **остановились на правке `.env.production`**.

---

## Доступы и пути

| | |
|--|--|
| Сайт | https://www.gdefazan.ru |
| Сервер | `ssh root@135.181.139.208` или Selectel → Magdalena → **Консоль** |
| Проект на VPS | `/var/www/gdefazan` |
| Env | `/var/www/gdefazan/.env.production` |
| PM2 | `pm2 status`, `pm2 logs gdefazan` |
| Nginx | `/etc/nginx/sites-available/gdefazan` |
| Инструкция деплоя | `docs/timeweb-deploy.md` |

---

## Команды-шпаргалка

```bash
# статус
pm2 status
pm2 logs gdefazan --lines 30

# после правки .env (без rebuild)
pm2 restart gdefazan

# обновление кода
cd /var/www/gdefazan && git pull
export NODE_OPTIONS=--max-old-space-size=1400
npm run build
pm2 restart gdefazan

# сборка в фоне (если уходите с телефона)
nohup npm run build > /tmp/build.log 2>&1 &
tail -20 /tmp/build.log
```

---

## Уроки (не повторять)

| Ошибка | Правильно |
|--------|-----------|
| `apt install nodejs` | NodeSource **22**: `setup_22.x \| bash -` |
| Команды склеиваются в консоли | **по одной строке** |
| `curl ... > head` | `curl ... \| head` |
| `pm2 start server.js` без env | `pm2 start deploy/ecosystem.config.cjs` |
| `next-build.tgz` в git | в `.gitignore`, не коммитить |
| `export { dynamic }` из route | `export const dynamic = "force-dynamic"` локально |
| AdBlock режет `/api/admin/` | витрина: `/api/storefront/` |

---

## Чеклист «готово», когда

- [ ] `curl .../api/storefront/products` — товары в JSON
- [ ] Нет `Invalid API key` в `pm2 logs`
- [ ] Карточки на главной, каталог открывается
- [ ] Кнопки и карусель работают (production, Ctrl+F5)
- [ ] Фото в карточках (если загружены в Supabase)
