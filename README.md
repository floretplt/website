# Floret Poltava — flower shop

Next.js 14 (App Router), TypeScript, Tailwind, Supabase, LiqPay, Telegram, next-intl (UK default + EN).

## Setup

1. Copy `.env.example` to `.env.local` and fill values. See **[docs/ENV.md](docs/ENV.md)** for full descriptions and security notes.
2. In Supabase SQL editor, run `supabase/migrations/001_initial.sql`.
3. Create the **`products` storage bucket**, create the **admin Auth user**, and set **`ADMIN_EMAIL`** — step-by-step: **[docs/SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md)**.
6. Seed demo data:

```bash
npm install
npm run seed
```

7. Run dev:

```bash
npm run dev
```

## Payments (LiqPay)

- Checkout: `POST /api/liqpay/checkout` with `{ orderId }` after creating an order with `payment_method: prepay`.
- Callback: `POST /api/liqpay/callback` — configure the same URL in LiqPay merchant settings as **server_url**.

## Deploy (Vercel)

- Connect repo, set env vars from `.env.example`.
- Set `NEXT_PUBLIC_SITE_URL` to the production URL (used in LiqPay redirects and SEO).

## Logo

Replace `public/logo.svg` with your traced brand SVG (`fill: currentColor` recommended).
