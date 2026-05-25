# Manual test matrix (FLORET)

Run after each production deploy or major payment/UI change. Record browser + date in your release notes.

## Browsers

| Target | Notes |
|--------|--------|
| Safari iOS 16+ | Primary mobile |
| Safari iOS 15 | `dvh` / overflow fallbacks |
| Chrome Android | LiqPay + address |
| Firefox desktop | Admin + catalog |
| Safari macOS | Checkout + admin |

## Storefront flows

1. **Reserve** — «Забронювати»: Telegram photo + buttons, thank-you with order number, no false «paid».
2. **Prepay** — «Оплатити зараз»: Telegram «Оплата ініційована», LiqPay round-trip, result page polls until paid, thank-you shows paid copy only when DB `paid=true`.
3. **Prepay partial failure** — If checkout init fails after order create: order number visible + retry / status lookup CTA.
4. **Order lookup** — Phone + order number on `/order/[orderNumber]`.
5. **Catalog** — Mood filters + sort at **375px** and **768px**; tab touch targets ≥44px.
6. **PDP** — Gallery thumbs (3-col on narrow), sticky CTA above safe area on iPhone.
7. **Address** — Autocomplete with Maps key; manual input when script blocked or key missing.

## Payment / security (production)

- LiqPay amount mismatch does **not** mark order paid (check logs).
- `sandbox` status rejected when `NODE_ENV=production`.
- `/api/liqpay/confirm` polling (~20×) does not return **429**.
- Checkout/confirm require valid `floret_order_checkout` cookie for prepay orders.

## Admin (mobile width ~375px)

- Dashboard + orders list: card layout (no horizontal scroll only).
- Order detail: label/value stacks on narrow screens.
- Status dropdown + mark paid on order detail.
- LiqPay link copy: clipboard or `prompt` fallback.

## Production env checklist

Before go-live, verify on the host:

- `NEXT_PUBLIC_SITE_URL` (www, HTTPS)
- `LIQPAY_*`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`
- `TELEGRAM_WEBHOOK_SECRET` + `scripts/set-telegram-webhook.sh`
- `ADMIN_EMAIL`
- `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` (recommended)
- Optional: `ORDER_CHECKOUT_SECRET`, `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`

See [ENV.md](./ENV.md) for details.
