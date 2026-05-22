# gdefazan.ru — чеклист на завтра (handoff)

**Дата:** 2026-05-22  
**Статус:** сайт открывается по HTTPS, **товаров на витрине нет**.

---

## Что уже сделано

| Компонент | Детали |
|-----------|--------|
| **VPS** | Selectel, **Magdalena**, Ubuntu 24.04, Москва |
| **IP** | `135.181.139.208` (не путать с `135.106.139.208`) |
| **SSH** | `ssh root@135.181.139.208`, пароль: панель → VDS → Magdalena → **Консоль** → сгенерировать |
| **Код** | `/var/www/gdefazan` — `git clone` с GitHub `malchikbabushka/gdefazan` |
| **Node** | 22 (через NodeSource; Ubuntu 18 удаляли вручную) |
| **Сборка** | `npm run build` — OK |
| **PM2** | `pm2 start server.js --name gdefazan` (файла `deploy/ecosystem.config.cjs` **нет на GitHub**) |
| **Проверка app** | `curl -sI http://127.0.0.1:3000/api/site-config` → **200 OK** |
| **Nginx** | `/etc/nginx/sites-available/gdefazan` |
| **SSL** | Let's Encrypt до **2026-08-19**, certbot OK |
| **Сайт** | https://www.gdefazan.ru открывается **без VPN** |

**Не на GitHub (есть только локально на ПК):**

- `deploy/ecosystem.config.cjs`
- `deploy/nginx-gdefazan.conf`
- `docs/timeweb-deploy.md` (и этот файл)

---

## Проблема на завтра: пустой каталог

Витрина берёт товары с **`GET /api/storefront/products`** (раньше `/api/admin/products` — блокировалось AdBlock).

**Исправление в коде (нужен deploy):** `src/app/api/storefront/products/`, `products-store.ts`, фото через `/api/storefront/products/.../photo`, карусель `LandingHero` pointer-events.

При ошибке Supabase API отдаёт `{ "products": [] }` — главная пустая.

### Диагностика (на сервере)

```bash
curl -s https://www.gdefazan.ru/api/admin/products | head -c 800
pm2 logs gdefazan --lines 50
cd /var/www/gdefazan && ls -la .env.production
grep -E '^NEXT_PUBLIC_SUPABASE_URL=|^SUPABASE_SERVICE_ROLE_KEY=' .env.production
```

### Типичные причины

1. **`.env.production`** на VPS неполный или неверный:
   - `NEXT_PUBLIC_SUPABASE_URL` → только `https://*.supabase.co` (не `.com`)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (без `NEXT_PUBLIC_`)
   - `NEXT_PUBLIC_SITE_URL=https://www.gdefazan.ru`
2. После правки env: `pm2 restart gdefazan`
3. **Supabase → Table Editor → `admin_products`** — пусто или `published = false`
4. Товары только в локальном `data/admin-db.json` на ПК — на VPS файла нет, нужен импорт в Supabase или админка на проде

### Проверка в браузере

- https://www.gdefazan.ru/admin — есть ли товары?
- https://www.gdefazan.ru/api/admin/products — JSON с массивом `products`

---

## DNS (REG.RU)

Убедиться:

| Тип | Имя | Значение |
|-----|-----|----------|
| A | `@` | `135.181.139.208` |
| A | `www` | `135.181.139.208` |

Проверка с сервера: `dig +short gdefazan.ru A`

Спринтхост / Vercel A-записи — убрать.

---

## Команды на сервере (шпаргалка)

```bash
# статус
pm2 status
pm2 logs gdefazan --lines 30

# перезапуск после .env
cd /var/www/gdefazan
pm2 restart gdefazan

# обновление кода (после push на GitHub)
git pull
export NODE_OPTIONS=--max-old-space-size=1536
npm ci
npm run build
pm2 restart gdefazan

# nginx
nginx -t && systemctl reload nginx

# SSL продление (авто, при необходимости)
certbot renew --dry-run
```

---

## Задачи на завтра (порядок)

- [ ] `curl` `/api/admin/products` — пустой массив или товары?
- [ ] Проверить/дописать `.env.production` на VPS, `pm2 restart`
- [ ] Supabase: строки в `admin_products`, `published = true`
- [ ] Админка https://www.gdefazan.ru/admin — логин, товары, фото
- [ ] Главная + карточка товара + `/api/site-config` без VPN
- [ ] (Опционально) `git push` с ПК: `deploy/`, `docs/timeweb-deploy.md` — чтобы на сервере был `pm2 start deploy/ecosystem.config.cjs`
- [ ] (Опционально) `pm2 save` + `pm2 startup` если автозапуск не настроен
- [ ] Спринтхост можно не использовать

---

## Локальный проект (ПК)

- Путь: `C:\Users\2\Documents\thermal-shop`
- GitHub: https://github.com/malchikbabushka/gdefazan
- Инструкция деплоя: `docs/timeweb-deploy.md`
- Env для копирования на сервер: `.env.local` → `.env.production` на VPS

---

## Уроки (не повторять)

- Панель Selectel: сервер в **Продукты → VDS серверы**, не «Аккаунт → Проекты»
- SSH IP: **135.181.139.208**
- Node: не `apt install nodejs` (18), а **NodeSource 22**; команды **по одной строке** в браузерной консоли
- `curl ... | head`, не `> head`
- `deploy/` на GitHub не было — PM2 через `server.js` напрямую

---

## Контакты / ссылки

- Selectel: https://my.selectel.ru → VDS → Magdalena → Консоль
- Supabase: проект из `.env.local`
- REG.RU: DNS домена gdefazan.ru
