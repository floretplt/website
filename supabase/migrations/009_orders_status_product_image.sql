-- New order lifecycle statuses + snapshot image URL for admin / Telegram
alter table public.orders drop constraint if exists orders_status_check;

update public.orders
set status = 'in_progress'
where status = 'confirmed';

update public.orders
set status = 'completed'
where status = 'done';

update public.orders
set status = 'ready'
where delivery_type = 'pickup' and status = 'out_for_delivery';

alter table public.orders
  add column if not exists product_image_url text;

alter table public.orders
  add constraint orders_status_check check (
    status in (
      'new',
      'in_progress',
      'ready',
      'out_for_delivery',
      'completed',
      'cancelled'
    )
  );
