#!/usr/bin/env bash
# Register Telegram webhook with secret token (matches TELEGRAM_WEBHOOK_SECRET in .env).
# Usage:
#   export TELEGRAM_BOT_TOKEN=...
#   export TELEGRAM_WEBHOOK_SECRET="$(openssl rand -hex 16)"
#   export PUBLIC_BASE_URL=https://your-domain.com   # no trailing slash
#   bash scripts/set-telegram-webhook.sh
set -euo pipefail
: "${TELEGRAM_BOT_TOKEN:?Set TELEGRAM_BOT_TOKEN}"
: "${TELEGRAM_WEBHOOK_SECRET:?Set TELEGRAM_WEBHOOK_SECRET}"
: "${PUBLIC_BASE_URL:?Set PUBLIC_BASE_URL (e.g. https://example.com)}"
export WEBHOOK_URL="${PUBLIC_BASE_URL}/api/telegram/webhook"
BODY="$(node -e "console.log(JSON.stringify({url: process.env.WEBHOOK_URL, secret_token: process.env.TELEGRAM_WEBHOOK_SECRET, allowed_updates: ['callback_query']}))")"
curl -sS -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook" \
  -H "Content-Type: application/json" \
  -d "$BODY"
echo
