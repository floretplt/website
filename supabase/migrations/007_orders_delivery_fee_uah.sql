-- Optional delivery fee (UAH) when district/window pricing applies; LiqPay uses bouquet + fee.
alter table public.orders
  add column if not exists delivery_fee_uah numeric(12, 2);
