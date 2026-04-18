-- Stock quantity not used; product availability is boolean only.
alter table public.products drop column if exists stock_quantity;
