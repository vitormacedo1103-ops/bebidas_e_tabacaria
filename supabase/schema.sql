-- Bebidas & Tabacaria — Supabase schema
-- Rode todo este arquivo no SQL Editor do Supabase
-- Idempotente onde possível

-- Extensions
create extension if not exists "pgcrypto";

-- Categories
create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  created_at timestamptz default now()
);
-- Products
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text default '',
  price numeric(10,2) not null check (price >= 0),
  promo_price numeric(10,2) check (promo_price is null or promo_price >= 0),
  category_id uuid references categories(id) on delete set null,
  is_active boolean default true,
  stock int default 0 check (stock >= 0),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_products_category on products(category_id);
create index if not exists idx_products_active on products(is_active);

-- Product images
create table if not exists product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  url text not null,
  position int default 0,
  is_main boolean default false,
  created_at timestamptz default now()
);
create index if not exists idx_images_product on product_images(product_id);

-- Product variants
create table if not exists product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  title text not null,
  price numeric(10,2) check (price is null or price >= 0),
  stock int default 0 check (stock >= 0),
  created_at timestamptz default now()
);
create index if not exists idx_variants_product on product_variants(product_id);

-- Updated at trigger
create or replace function set_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end; $$ language plpgsql;
drop trigger if exists trg_products_updated on products;
create trigger trg_products_updated before update on products for each row execute function set_updated_at();

-- Seed categories (idempotente)
insert into categories (slug, name) values
  ('cervejas','Cervejas'),('bebidas','Bebidas'),('destilados','Destilados'),
  ('energeticos','Energéticos'),('tabacaria','Tabacaria'),('acessorios','Acessórios'),('combos','Combos')
on conflict (slug) do nothing;

-- RLS
alter table categories enable row level security;
alter table products enable row level security;
alter table product_images enable row level security;
alter table product_variants enable row level security;

-- Permite leitura pública apenas de produtos ativos (loja)
drop policy if exists "public read categories" on categories;
create policy "public read categories" on categories for select using (true);

drop policy if exists "public read active products" on products;
create policy "public read active products" on products for select using (is_active = true);

drop policy if exists "public read images of active products" on product_images;
create policy "public read images of active products" on product_images for select using (
  exists (select 1 from products p where p.id = product_id and p.is_active = true)
);

drop policy if exists "public read variants of active products" on product_variants;
create policy "public read variants of active products" on product_variants for select using (
  exists (select 1 from products p where p.id = product_id and p.is_active = true)
);

-- Admin (qualquer usuário autenticado) pode fazer tudo — ajuste para single-admin é suficiente
drop policy if exists "auth all categories" on categories;
create policy "auth all categories" on categories for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "auth all products" on products;
create policy "auth all products" on products for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "auth all images" on product_images;
create policy "auth all images" on product_images for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "auth all variants" on product_variants;
create policy "auth all variants" on product_variants for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- Storage bucket product-images
insert into storage.buckets (id, name, public) values ('product-images','product-images', true)
on conflict (id) do nothing;

-- Storage policies
drop policy if exists "public read product-images" on storage.objects;
create policy "public read product-images" on storage.objects for select using (bucket_id = 'product-images');

drop policy if exists "auth write product-images" on storage.objects;
create policy "auth write product-images" on storage.objects for all using (auth.role() = 'authenticated' and bucket_id = 'product-images')
  with check (auth.role() = 'authenticated' and bucket_id = 'product-images');
