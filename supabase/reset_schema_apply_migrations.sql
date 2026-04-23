-- =============================================================================
-- FLORET: wipe shop schema + apply migrations 001–005 in one run (Supabase SQL Editor)
--
-- WARNING: Deletes ALL rows in public.orders, public.products, public.site_settings
--          and recreates tables. Use only on dev or when you accept data loss.
--
-- Usage: copy this entire file → Supabase → SQL Editor → Run once.
-- =============================================================================

-- --- reset (dependency order) ---
drop table if exists public.orders cascade;
drop table if exists public.products cascade;
drop table if exists public.site_settings cascade;
drop sequence if exists public.orders_order_number_seq cascade;

-- ========== 001_initial.sql ==========
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
  status text not null default 'new' check (status in ('new', 'in_progress', 'ready', 'out_for_delivery', 'completed', 'cancelled')),
  product_image_url text,
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

-- ========== 002_order_product_size.sql ==========
-- Chosen bouquet size at order time (S / M / L), independent of catalog "style" row
alter table public.orders
  add column if not exists product_size text
  check (product_size is null or product_size in ('small', 'medium', 'large'));

-- ========== 003_product_prices_by_size.sql ==========
-- Per-size pricing (UAH + EUR). Replaces single price_uah / price_eur.

alter table public.products
  add column if not exists price_uah_small numeric(12,2),
  add column if not exists price_uah_medium numeric(12,2),
  add column if not exists price_uah_large numeric(12,2),
  add column if not exists price_eur_small numeric(12,2),
  add column if not exists price_eur_medium numeric(12,2),
  add column if not exists price_eur_large numeric(12,2);

-- Copy legacy single price into all three tiers (existing rows).
update public.products
set
  price_uah_small = price_uah,
  price_uah_medium = price_uah,
  price_uah_large = price_uah,
  price_eur_small = price_eur,
  price_eur_medium = price_eur,
  price_eur_large = price_eur
where price_uah is not null
  and price_uah_small is null;

alter table public.products alter column price_uah_small set not null;
alter table public.products alter column price_uah_medium set not null;
alter table public.products alter column price_uah_large set not null;
alter table public.products alter column price_eur_small set not null;
alter table public.products alter column price_eur_medium set not null;
alter table public.products alter column price_eur_large set not null;

alter table public.products drop column if exists price_uah;
alter table public.products drop column if exists price_eur;

-- ========== 004_drop_product_stock_quantity.sql ==========
-- Stock quantity not used; product availability is boolean only.
alter table public.products drop column if exists stock_quantity;

-- ========== 005_product_moods_nullable_prices_delivery.sql ==========
-- Color moods: replace neutral with expanded set (pink, blue, yellow, red, white, bright)
update public.products
set color_mood = 'pink'
where color_mood = 'neutral';

alter table public.products drop constraint if exists products_color_mood_check;

alter table public.products
  add constraint products_color_mood_check
  check (color_mood in ('pink', 'blue', 'yellow', 'red', 'white', 'bright'));

-- Allow partial S/M/L pricing (at least one tier required; enforced below)
alter table public.products alter column price_uah_small drop not null;
alter table public.products alter column price_uah_medium drop not null;
alter table public.products alter column price_uah_large drop not null;
alter table public.products alter column price_eur_small drop not null;
alter table public.products alter column price_eur_medium drop not null;
alter table public.products alter column price_eur_large drop not null;

alter table public.products drop constraint if exists products_price_tiers_nonempty;

alter table public.products
  add constraint products_price_tiers_nonempty check (
    (price_uah_small is not null and price_uah_small > 0)
    or (price_uah_medium is not null and price_uah_medium > 0)
    or (price_uah_large is not null and price_uah_large > 0)
  );

alter table public.products
  add constraint products_price_uah_positive check (
    (price_uah_small is null or price_uah_small > 0)
    and (price_uah_medium is null or price_uah_medium > 0)
    and (price_uah_large is null or price_uah_large > 0)
  );

-- same_day_cutoff_time = last moment to *place* an order for delivery today
update public.site_settings
set same_day_cutoff_time = '18:10:00'
where same_day_cutoff_time = '14:00:00';

alter table public.site_settings
  add column if not exists same_day_delivery_end_time time not null default '19:00:00';
