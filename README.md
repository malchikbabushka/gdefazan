## Thermal Shop (демо)

Демо-структура современного интернет-магазина **тепловизионных прицелов и монокуляров для охоты** на **Next.js (App Router)** и **Tailwind CSS** в тёмной (military) стилистике.

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

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
