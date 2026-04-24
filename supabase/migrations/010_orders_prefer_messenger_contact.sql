alter table public.orders
  add column if not exists prefer_messenger_contact boolean not null default false;
