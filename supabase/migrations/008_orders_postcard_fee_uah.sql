-- Optional postcard add-on (UAH) when gift_message is non-empty; included in LiqPay amount.
alter table public.orders
  add column if not exists postcard_fee_uah numeric(12, 2);
