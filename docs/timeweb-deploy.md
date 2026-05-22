# Деплой на [Timeweb Cloud VPS](https://timeweb.cloud/) + домен REG.RU

Магазин — **Next.js 16** + **Supabase**. На VPS сборка идёт **на сервере** (`npm run build`) — без WSL и заливки `.tgz`.

Репозиторий: **https://github.com/malchikbabushka/gdefazan**

---

## 1. Заказ VPS

В [Timeweb Cloud](https://timeweb.cloud/) → **Серверы → VPS**:

| Параметр | Значение |
|----------|----------|
| ОС | **Ubuntu 22.04** или 24.04 |
| RAM | **минимум 2 GB** |
| Регион | Россия |

Запишите **внешний IPv4**.

Альтернатива без SSH: [App Platform + Next.js](https://timeweb.cloud/docs/apps/deploying-frontend-apps/nextjs) (деплой из Git). Для этого проекта с `server.js` и Supabase удобнее **VPS** по инструкции ниже.

---

## 2. DNS в REG.RU

1. **DNS-серверы REG.RU** (без Cloudflare, если мешал доступ).
2. Записи:

| Тип | Имя | Значение |
|-----|-----|----------|
| **A** | `@` | IP VPS |
| **A** | `www` | тот же IP |

Удалите записи на Vercel / старый Спринтхост.

---

## 3. SSH на сервер

```bash
ssh root@ВАШ_IP
```

(Логин/ключ — из панели Timeweb.)

---

## 4. Node 22, nginx, PM2

```bash
apt update && apt upgrade -y
apt install -y curl git nginx certbot python3-certbot-nginx

curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs

node -v   # v22.x
npm -v

npm install -g pm2
```

---

## 5. Код и переменные

```bash
mkdir -p /var/www && cd /var/www
git clone https://github.com/malchikbabushka/gdefazan.git
cd gdefazan
```

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

Значения — **Supabase → Settings → API**.  
`SUPABASE_SERVICE_ROLE_KEY` **без** `NEXT_PUBLIC_`.

---

## 6. Сборка и запуск

```bash
export NODE_OPTIONS=--max-old-space-size=1536
npm ci
npm run build

pm2 start deploy/ecosystem.config.cjs
pm2 save
pm2 startup
```

Проверка:

```bash
curl -sI http://127.0.0.1:3000/api/site-config | head -5
curl -s http://127.0.0.1:3000/api/site-config | head -c 200
```

Должен быть JSON, не 500.

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

## 8. Обновление после правок в коде

```bash
cd /var/www/gdefazan
git pull
npm ci
export NODE_OPTIONS=--max-old-space-size=1536
npm run build
pm2 restart gdefazan
```

Контент (товары, цены) в **админке / Supabase** — без `git pull`, как раньше.

---

## 9. Отключить Спринтхост

Когда сайт на Timeweb открывается:

- В REG.RU DNS уже на IP VPS.
- В панели Спринтхост сайт можно оставить или удалить — на домен он больше не влияет.

---

## 10. Поддержка

- [Деплой Node.js](https://timeweb.cloud/tutorials/nodejs/deploj-node-js-prilozheniya)
- [Next.js в App Platform](https://timeweb.cloud/docs/apps/deploying-frontend-apps/nextjs) — если позже захотите деплой из Git без SSH
