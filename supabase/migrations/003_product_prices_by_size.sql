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
