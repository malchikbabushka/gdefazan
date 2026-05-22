# Деплой на [Спринтхост](https://sprinthost.ru/) + домен REG.RU

Магазин — **Next.js 16** + **Supabase**. На виртуальном хостинге Спринтхост Node.js работает через **Phusion Passenger** ([инструкция](https://help.sprinthost.ru/howto/nodejs)).

Репозиторий: **https://github.com/malchikbabushka/gdefazan**

---

## Что нужно на Спринтхосте

1. Тариф **виртуального хостинга** с **SSH** (в панели включён доступ по SSH).
2. Сайт **gdefazan.ru** (или поддомен) привязан к аккаунту.
3. В панели: **Сайты → Веб-серверы** → для домена выбрать **Node.js 22** ([справка](https://help.sprinthost.ru/howto/nodejs)).

Если `npm run build` падает по памяти — закажите **Sprintbox VDS** ([sprintbox.ru](https://sprintbox.ru/)) или собирайте проект на компьютере и заливайте по SFTP (см. §7).

---

## 1. DNS в REG.RU

1. **Домены → gdefazan.ru** → DNS-серверы **REG.RU** (без Cloudflare, если мешал доступ).
2. Записи у регистратора (или в панели Спринтхоста, если NS у них):

| Тип | Имя | Значение |
|-----|-----|----------|
| **A** | `@` | IP из панели Спринтхоста (сайт → сведения) |
| **A** | `www` | тот же IP |

Старые записи на Vercel (`76.76.21.21`, `vercel-dns`) — удалить.

---

## 2. Подключение по SSH

Логин и хост — в панели Спринтхост → **SSH**.

```bash
ssh LOGIN@SERVER.sprinthost.ru
```

Корень сайта обычно:

```text
~/domains/gdefazan.ru/public_html
```

---

## 3. Клонирование и переменные

```bash
cd ~/domains/gdefazan.ru/public_html

# если каталог не пустой — бэкап или удалите лишнее
git clone https://github.com/malchikbabushka/gdefazan.git .

nano .env.production
```

Содержимое (значения из Supabase → Settings → API):

```env
NODE_ENV=production
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_SITE_URL=https://www.gdefazan.ru
```

Файл `.env.production` Next.js подхватывает при `build` и `start`.

---

## 4. Сборка (Node 22 на Спринтхосте)

```bash
cd ~/domains/gdefazan.ru/public_html

# менеджер пакетов под Node 22 — см. help.sprinthost.ru/howto/nodejs
npm22 ci
npm22 run build
```

При нехватке RAM:

```bash
export NODE_OPTIONS=--max-old-space-size=1536
npm22 run build
```

---

## 5. Файл `.htaccess` (Passenger)

Скопируйте шаблон [`deploy/sprinthost.htaccess.example`](../deploy/sprinthost.htaccess.example) в `public_html/.htaccess`.

Замените:

- `LOGIN` — ваш SSH-логин;
- `gdefazan.ru` — имя сайта в панели, если отличается.

Пример:

```apache
SetEnv GHOST_NODE_VERSION_CHECK false
SetEnv NODE_ENV production
PassengerStartupFile server.js
PassengerResolveSymlinksInDocumentRoot on
Require all granted
PassengerAppType node
PassengerAppRoot /home/ВАШ_ЛОГИН/domains/gdefazan.ru/public_html
Options -MultiViews
```

В корне репозитория уже есть **`server.js`** — точка входа для Passenger.

Перезапуск приложения:

```bash
mkdir -p tmp
touch tmp/restart.txt
```

---

## 5.1. Ошибка 500 Internal Server Error

Чаще всего Passenger стартует Next в **dev**-режиме (нет `NODE_ENV=production`).

В `.htaccess` должна быть строка `SetEnv NODE_ENV production` (см. шаблон `deploy/sprinthost.htaccess.example`), затем `touch tmp/restart.txt`.

На SSH — лог Passenger (см. `PassengerAppLogFile` в `.htaccess`) и ручной запуск:

```bash
cd ~/domains/gdefazan.ru/public_html
mkdir -p tmp
tail -50 tmp/passenger-app.log
NODE_ENV=production PORT=45678 node22 server.js
```

Журналы Apache: в панели **Сайты → gdefazan.ru → журналы веб-сервера** (включите, если выключены). Каталог `~/domains/…/logs/` появляется после включения, не создавайте его вручную «пустым».

Если `node22 server.js` падает с текстом ошибки — пришлите его в поддержку или в чат; типично: нет `node_modules` → `npm22 ci`.

---

## 6. SSL

В панели Спринтхост обычно можно включить **Let's Encrypt** для домена. Либо закажите SSL в разделе сайта — следуйте мастеру в панели.

Проверка:

- `https://www.gdefazan.ru`
- `https://www.gdefazan.ru/api/site-config` — JSON
- `https://www.gdefazan.ru/admin/login` — админка (Supabase Auth)

---

## 7. Обновление после правок

На сервере:

```bash
cd ~/domains/gdefazan.ru/public_html
git pull
npm22 ci
npm22 run build
touch tmp/restart.txt
```

Или с ПК: сначала `git push` на GitHub, потом на сервере `git pull`.

**Важно:** закоммитьте и запушьте локальные изменения — на GitHub сейчас может быть старая версия (апрель 2026).

---

## 8. Сборка на ПК, если на хостинге не хватает памяти

На Windows (в папке проекта):

```powershell
npm ci
npm run build
```

Залейте на сервер по **SFTP** (FileZilla): весь проект, включая `.next`, `node_modules`, `public`, `server.js`, `.env.production`, `.htaccess`. На сервере **не** запускайте `build`, только `touch tmp/restart.txt`.

---

## 9. Supabase

- БД и картинки остаются в **Supabase** (бесплатный план).
- Запросы к API идут **с сервера Спринтхоста** — для посетителей в РФ обычно лучше, чем Vercel + Cloudflare.
- Вход в админку в браузере всё ещё обращается к `*.supabase.co` — без VPN иногда не работает; витрина при этом может открываться.

---

## 10. Отключить Vercel (по желанию)

Чтобы не путаться: в Vercel → Domains уберите `gdefazan.ru`, или оставьте только как резерв.

---

## Поддержка Спринтхост

- [База знаний Node.js](https://help.sprinthost.ru/howto/nodejs)
- [Express (пример Passenger)](https://help.sprinthost.ru/framework/express)
- Тел.: 8 800 555-78-23, support@sprinthost.ru
