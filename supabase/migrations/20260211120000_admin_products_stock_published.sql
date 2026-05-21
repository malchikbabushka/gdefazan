-- Остаток и флаг публикации для admin_products
alter table public.admin_products
  add column if not exists stock_qty integer not null default 0;

alter table public.admin_products
  add column if not exists published boolean not null default true;

comment on column public.admin_products.stock_qty is 'Количество на складе (штук)';
comment on column public.admin_products.published is 'Показывать товар покупателям';
