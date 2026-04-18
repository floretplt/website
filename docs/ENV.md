# Environment variables

Copy `.env.example` to `.env.local` for local development. Never commit `.env.local` or real secrets.

Variables prefixed with `NEXT_PUBLIC_` are embedded in the browser bundle. Treat them as **public**. Everything else is **server-only** (API routes, Server Components, scripts).

---

## Public (client + server)

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SITE_URL` | **Yes** (production) | Canonical site URL with **no** trailing slash, e.g. `https://floret.example.com`. Used for metadata base URL, sitemap/robots, JSON-LD, and LiqPay `result_url`. Local default in code is `http://localhost:3000` if unset. |
| `NEXT_PUBLIC_SUPABASE_URL` | **Yes** | Supabase project URL (`https://<project-ref>.supabase.co`). Used by the Supabase client, image URLs for Storage, and `next.config.mjs` image `remotePatterns`. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` **or** `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **Yes** | Same value: Supabase **anon / publishable** key (Project Settings → API). Either variable name works; publishable is checked first. Safe in the browser; RLS applies. |
| `NEXT_PUBLIC_LIQPAY_PUBLIC_KEY` | For online pay | LiqPay public key. Required for `/api/liqpay/checkout` when customers choose “pay now”. |

---

## Server-only

| Variable | Required | Description |
|----------|----------|-------------|
| `SUPABASE_SERVICE_ROLE_KEY` | **Yes** (for admin + APIs) | Supabase **service role** key. **Keep secret.** Bypasses RLS. Used by `lib/supabase/admin.ts`, order creation API, seed script, and admin server actions. Without it, admin mutations and `POST /api/orders` will fail. **Where:** Dashboard → **Project Settings** (gear) → **API** → **Secret keys** → **`service_role`** (same page as the Project URL and publishable key). |
| `LIQPAY_PRIVATE_KEY` | For online pay | LiqPay private key. Used to sign checkout payloads and verify `/api/liqpay/callback`. Never expose to the client. |
| `TELEGRAM_BOT_TOKEN` | Optional | Telegram Bot API token from [@BotFather](https://t.me/BotFather). If missing, order notifications and inquiry webhooks are skipped (warning logged). |
| `TELEGRAM_CHAT_ID` | Optional | Target chat ID for bot messages (same bot must be able to post there). Used for order notifications, `POST /api/decor-inquiry`, and `POST /api/wedding-inquiry`. |

---

## Admin access

| Variable | Required | Description |
|----------|----------|-------------|
| `ADMIN_EMAIL` | **Yes in production** | Email of the Supabase Auth user allowed to use `/admin`. If unset: **development** allows any signed-in user; **production** blocks admin for everyone until this is set. |

---

## Implicit

| Variable | Notes |
|----------|--------|
| `NODE_ENV` | Set by Next.js (`development` / `production`). Used in `lib/auth.ts` for admin access when `ADMIN_EMAIL` is missing. |

---

## Setup checklist

1. **Supabase** — Create a project; run `supabase/migrations/001_initial.sql`; create Storage bucket `products`; enable Email auth and create the admin user.
2. **Local** — `cp .env.example .env.local` and fill all **Yes** rows.
3. **LiqPay** — In the merchant cabinet, set the **server URL** (callback) to:  
   `{NEXT_PUBLIC_SITE_URL}/api/liqpay/callback`  
   Use the same base URL you deploy with (HTTPS in production).
4. **Vercel (or similar)** — Add every variable from `.env.example` in the project settings; set `NEXT_PUBLIC_SITE_URL` to your production domain.

**Wedding products in Supabase:** The shop no longer lists a wedding product catalog. If your database still has rows in `public.products` with `category = 'wedding'` from an older seed, you can delete them in the Supabase SQL editor or via admin; they are not shown on the site.

---

## Files that reference env vars

- `lib/supabase/env.ts` — resolves URL + publishable/anon key  
- `lib/supabase/{server,client,admin}.ts` — Supabase clients  
- `lib/auth.ts` — `ADMIN_EMAIL`, `NODE_ENV`  
- `lib/telegram.ts` — Telegram bot  
- `app/api/decor-inquiry/route.ts`, `app/api/wedding-inquiry/route.ts` — Telegram inquiries  
- `lib/product-display.ts` — public image URLs from Storage  
- `app/api/liqpay/*` — LiqPay keys and site URL  
- `app/layout.tsx`, `app/[locale]/layout.tsx`, `app/sitemap.ts`, `app/robots.ts` — `NEXT_PUBLIC_SITE_URL`  
- `next.config.mjs` — Supabase host for `next/image`  
- `scripts/seed.ts` — Supabase URL + service role  

---

## Security reminders

- Rotate keys if they leak.  
- Service role and LiqPay private key must only exist on the server and in CI secrets, never in client code or public repos.  
- `NEXT_PUBLIC_*` values are visible to anyone who loads the site—only put keys there that are designed to be public (anon key, LiqPay public key).
