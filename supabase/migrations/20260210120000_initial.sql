-- Thermal Shop Admin Pro — core schema (run in Supabase SQL editor or via CLI)
-- Requires: extension pgcrypto for gen_random_uuid()

create extension if not exists "pgcrypto";

-- Admin catalog (mirrors AdminProduct + timestamps)
create table if not exists public.admin_products (
  id text primary key,
  name text not null,
  brand text not null,
  price_rub numeric not null default 0,
  stock_qty integer not null default 0,
  published boolean not null default true,
  category text not null default 'thermal-scope',
  magnification text not null default '',
  lens_diameter_mm integer not null default 0,
  in_stock boolean not null default true,
  linked_catalog_product_id text,
  description text not null default '',
  specs_text text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id text not null references public.admin_products (id) on delete cascade,
  sort_order integer not null default 0,
  storage_path text,
  public_url text not null,
  created_at timestamptz not null default now()
);

create index if not exists product_images_product_id_idx on public.product_images (product_id);

create table if not exists public.orders (
  id text primary key,
  status text not null default 'new',
  total_rub numeric not null default 0,
  customer_email text,
  customer_phone text,
  customer_name text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id text not null references public.orders (id) on delete cascade,
  product_id text,
  product_name text not null,
  quantity integer not null default 1,
  price_rub numeric not null default 0
);

create index if not exists order_items_order_id_idx on public.order_items (order_id);

-- Single-row JSON site config (menu, contacts, etc.)
create table if not exists public.site_settings (
  id text primary key default 'default',
  config jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

insert into public.site_settings (id, config)
values ('default', '{}'::jsonb)
on conflict (id) do nothing;

-- CMS static pages
create table if not exists public.cms_pages (
  page_key text primary key,
  title text not null default '',
  body text not null default '',
  updated_at timestamptz not null default now()
);

-- RLS: lock down; server uses service_role (bypasses RLS)
alter table public.admin_products enable row level security;
alter table public.product_images enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.site_settings enable row level security;
alter table public.cms_pages enable row level security;

-- Optional: public read for published CMS / site config via anon (uncomment if needed)
-- create policy "Public read cms" on public.cms_pages for select using (true);
-- create policy "Public read site" on public.site_settings for select using (id = 'default');

comment on table public.admin_products is 'Admin-managed products; images in product_images';
comment on table public.product_images is 'Product gallery; public_url for CDN or signed URLs';
