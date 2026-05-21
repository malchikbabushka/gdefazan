## Thermal Shop (демо)

Демо-структура современного интернет-магазина **тепловизионных прицелов и монокуляров для охоты** на **Next.js (App Router)** и **Tailwind CSS** в тёмной (military) стилистике.

### База и админка (Supabase)

Полная инструкция: **[`supabase/README.md`](./supabase/README.md)** — SQL, бакет `product-images`, пользователь Auth, переменные окружения. Без Supabase используется демо-файл `data/admin-db.json`.

**Деплой в РФ:** **[`docs/sprinthost-deploy.md`](./docs/sprinthost-deploy.md)** ([Спринтхост](https://sprinthost.ru/) + домен REG.RU). Репозиторий: [github.com/malchikbabushka/gdefazan](https://github.com/malchikbabushka/gdefazan).

### Что уже сделано

- **Главная страница**: героический баннер + каталог
- **Фильтры**: цена, матрица, линза, кратность, дальномер, наличие (клиентская фильтрация по демо-данным)
- **Сетка товаров**: карточки, бейджи параметров, цены, наличие

### Структура

- `src/app/page.tsx` — входная страница (рендерит клиентский `HomePage`)
- `src/components/home/*` — `Hero`, `Filters`, `ProductGrid`, `ProductCard`
- `src/lib/products.ts` — демо-товары
- `src/lib/catalog-logic.ts` — фильтрация/сортировка/форматирование
- `src/lib/catalog-types.ts` — типы каталога

---

Ниже — стандартный README от Next.js.

---

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Деплой на Vercel (админка + Supabase)

Сайт задеплоить можно за пару минут; **подключить GitHub и нажать Deploy может только владелец аккаунта** — заранее сделать это «за вас» из этого репозитория нельзя.

1. Залейте проект в **GitHub** (или GitLab / Bitbucket, как удобно).
2. Зайдите на [vercel.com/new](https://vercel.com/new) → **Import** вашего репозитория.
3. **Framework Preset:** Next.js (определится сам). **Root Directory:** корень (где лежит `package.json`).
4. В **Environment Variables** добавьте переменные из [`.env.example`](./.env.example):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`  
   Для **Production**, **Preview** и **Development** можно продублировать одни и те же значения.
5. Опционально: `NEXT_PUBLIC_SITE_URL` = `https://<ваш-проект>.vercel.app` (удобно для SEO/метаданных).
6. **Deploy**. После сборки админка: `https://<ваш-домен>/admin/login` — создайте пользователя в **Supabase → Authentication → Users** и войдите.
7. В Supabase выполните SQL из `supabase/migrations/` (см. [`supabase/README.md`](./supabase/README.md)), иначе таблиц не будет.

Локально без облака: не задавайте переменные Supabase — используется `data/admin-db.json`. **На Vercel файл не подходит для постоянных правок**; для продакшена нужен Supabase (или другая БД).

---

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
