-- Distance-based delivery fee tiers (UAH), edited in admin; shown on order form.
alter table public.site_settings
  add column if not exists delivery_pricing jsonb default '{"bands":[]}'::jsonb;
