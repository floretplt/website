-- Floret Poltava — initial schema
-- Run in Supabase SQL editor or via CLI

create extension if not exists "pgcrypto";

-- Products
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  name_uk text not null,
  name_en text not null,
  description_uk text,
  description_en text,
  category text not null check (category in ('bouquets', 'box-bouquets', 'wedding', 'decor')),
  size text not null check (size in ('small', 'medium', 'large')),
  color_mood text not null check (color_mood in ('pink', 'blue', 'bright', 'neutral', 'white')),
  price_uah numeric(12,2) not null,
  price_eur numeric(12,2) not null,
  images jsonb default '[]'::jsonb,
  image_url text,
  is_available boolean not null default true,
  is_featured boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (category, slug)
);

create index if not exists products_category_idx on public.products (category);
create index if not exists products_available_idx on public.products (is_available);
create index if not exists products_featured_idx on public.products (is_featured);

-- Orders
create sequence if not exists public.orders_order_number_seq;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number int not null default nextval('public.orders_order_number_seq'),
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  price_paid numeric(12,2) not null,
  currency text not null check (currency in ('UAH', 'EUR')),
  customer_name text not null,
  customer_phone text not null,
  customer_email text,
  delivery_type text not null check (delivery_type in ('pickup', 'delivery')),
  delivery_date date,
  delivery_time text,
  delivery_address text,
  recipient_phone text,
  gift_message text,
  notes text,
  payment_method text not null check (payment_method in ('prepay', 'reserve')),
  status text not null default 'new' check (status in ('new', 'confirmed', 'done', 'cancelled')),
  liqpay_order_id text,
  paid boolean not null default false,
  confirmed_at timestamptz,
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (order_number)
);

create index if not exists orders_status_idx on public.orders (status);
create index if not exists orders_created_idx on public.orders (created_at desc);
create index if not exists orders_phone_idx on public.orders (customer_phone);

-- Site settings (singleton)
create table if not exists public.site_settings (
  id uuid primary key default gen_random_uuid(),
  working_hours jsonb default '{}'::jsonb,
  same_day_cutoff_time time not null default '14:00',
  closed_weekdays int[] not null default array[]::int[],
  pickup_address_uk text not null default '',
  pickup_address_en text not null default '',
  phone text not null default '',
  email text,
  announcement_uk text,
  announcement_en text,
  hero_image_url text,
  about_short_uk text,
  about_short_en text,
  updated_at timestamptz not null default now()
);

-- RLS
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.site_settings enable row level security;

drop policy if exists "products_select_public" on public.products;
create policy "products_select_public"
  on public.products for select
  using (true);

drop policy if exists "site_settings_select_public" on public.site_settings;
create policy "site_settings_select_public"
  on public.site_settings for select
  using (true);

-- No insert/update/delete policies for anon — service role bypasses RLS

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists products_updated_at on public.products;
create trigger products_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

drop trigger if exists orders_updated_at on public.orders;
create trigger orders_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

drop trigger if exists site_settings_updated_at on public.site_settings;
create trigger site_settings_updated_at
  before update on public.site_settings
  for each row execute function public.set_updated_at();
