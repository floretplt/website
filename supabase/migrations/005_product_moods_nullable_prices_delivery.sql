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
