-- Chosen bouquet size at order time (S / M / L), independent of catalog "style" row
alter table public.orders
  add column if not exists product_size text
  check (product_size is null or product_size in ('small', 'medium', 'large'));
