# Деплой на Fornex (VPS) + домен REG.RU

> **Актуальная инструкция для хостинга:** [`sprinthost-deploy.md`](./sprinthost-deploy.md) ([Спринтхост](https://sprinthost.ru/)).

---

# Деплой на Fornex (VPS) + домен REG.RU

Магазин — **Next.js 16** с API-маршрутами и **Supabase**. Нужен **VPS** (не виртуальный PHP-хостинг).

Репозиторий: **https://github.com/malchikbabushka/gdefazan**

---

## 1. Что заказать в Fornex

- **VPS** (Ubuntu 22.04 или 24.04)
- Минимум **2 GB RAM** (для `npm run build`)
- 1 vCPU, 20+ GB NVMe — достаточно для старта

Запишите **внешний IP** сервера.

---

## 2. DNS в REG.RU (без Cloudflare)

1. **Домены → gdefazan.ru → DNS-серверы** — **DNS REG.RU** (не Cloudflare).
2. Записи:

| Тип | Имя | Значение |
|-----|-----|----------|
| **A** | `@` | IP VPS Fornex |
| **A** | `www` | тот же IP |

Удалите старые записи на Vercel / Cloudflare.

---

## 3. Подключение к серверу

```bash
ssh root@ВАШ_IP_FORNEX
```

---

## 4. Установка ПО

```bash
apt update && apt upgrade -y
apt install -y curl git nginx certbot python3-certbot-nginx

curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

node -v   # v20.x
npm -v

npm install -g pm2
```

---

## 5. Клонирование и переменные

```bash
mkdir -p /var/www && cd /var/www
git clone https://github.com/malchikbabushka/gdefazan.git
cd gdefazan
```

Создайте `.env.production` (или `.env.local` на сервере):

```bash
nano .env.production
```

```env
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0

NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

NEXT_PUBLIC_SITE_URL=https://www.gdefazan.ru
```

Значения — из **Supabase → Settings → API**.  
`SUPABASE_SERVICE_ROLE_KEY` **без** префикса `NEXT_PUBLIC_`.

---

## 6. Сборка и запуск

```bash
npm ci
npm run build
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

Проверка: `curl -s http://127.0.0.1:3000/api/site-config` — должен вернуть JSON.

---

## 7. Nginx

```bash
cp /var/www/gdefazan/deploy/nginx-gdefazan.conf /etc/nginx/sites-available/gdefazan
ln -sf /etc/nginx/sites-available/gdefazan /etc/nginx/sites-enabled/gdefazan
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
```

HTTPS:

```bash
certbot --nginx -d gdefazan.ru -d www.gdefazan.ru
```

---

## 8. Обновление после правок в GitHub

На сервере:

```bash
cd /var/www/gdefazan
git pull origin main
npm ci
npm run build
pm2 restart gdefazan
```

Или с ПК (если настроен SSH-ключ): `bash scripts/fornex-deploy.sh user@IP`

---

## 9. Перед первым деплоем — push в GitHub

На вашем ПК в папке проекта должны быть закоммичены все изменения:

```bash
git add -A
git commit -m "Production: Supabase, contacts, Fornex deploy configs"
git push origin main
```

Иначе на сервере останется старая версия от апреля 2026.

---

## 10. Проверка

| URL | Ожидание |
|-----|----------|
| `https://www.gdefazan.ru` | главная |
| `https://www.gdefazan.ru/api/site-config` | JSON |
| `https://www.gdefazan.ru/admin/login` | вход (Supabase Auth) |
| `https://www.gdefazan.ru/contacts` | контакты + карта |

---

## 11. Vercel

После переезда на Fornex в **Vercel → Domains** можно удалить `gdefazan.ru`, чтобы не путаться.

---

## 12. Если `npm run build` падает по памяти

Временно добавьте swap на VPS:

```bash
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

Или увеличьте тариф VPS в Fornex.
