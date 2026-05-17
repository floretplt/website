import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  answerTelegramCallbackQuery,
  editTelegramMessageReplyMarkup,
} from "@/lib/telegram";
import {
  parseTelegramOrderCallback,
  telegramOrderInlineKeyboard,
  type TelegramInlineKeyboard,
} from "@/lib/telegram-order-keyboard";
import { resolveOrderStatusAfterTelegramAction } from "@/lib/telegram-order-status";
import type { DeliveryType, OrderStatus } from "@/lib/constants";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: true });
  }

  const rawCq = (body as { callback_query?: Record<string, unknown> })
    .callback_query;
  const callbackId =
    rawCq?.id != null && String(rawCq.id).trim() !== ""
      ? String(rawCq.id)
      : null;

  const secret = process.env.TELEGRAM_WEBHOOK_SECRET?.trim();
  const got = req.headers.get("x-telegram-bot-api-secret-token")?.trim();

  if (secret) {
    const a = Buffer.from(got ?? "");
    const b = Buffer.from(secret);
    const tokenOk = a.length === b.length && timingSafeEqual(a, b);
    if (!tokenOk) {
      console.error(
        "Telegram webhook: secret token mismatch (check TELEGRAM_WEBHOOK_SECRET matches setWebhook secret_token; trim newlines in env).",
      );
      if (callbackId) {
        await answerTelegramCallbackQuery(
          callbackId,
          "Не вдалося оновити статус: сервер відхилив запит (перевірте TELEGRAM_WEBHOOK_SECRET на хостингу та scripts/set-telegram-webhook.sh).",
          true,
        );
      }
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  } else if (process.env.NODE_ENV === "production") {
    console.error("TELEGRAM_WEBHOOK_SECRET is not set");
    if (callbackId) {
      await answerTelegramCallbackQuery(
        callbackId,
        "Вебхук не налаштовано на сервері (TELEGRAM_WEBHOOK_SECRET).",
        true,
      );
    }
    return NextResponse.json({ error: "misconfigured" }, { status: 503 });
  }

  if (!callbackId || !rawCq) {
    return NextResponse.json({ ok: true });
  }

  const cq = rawCq;

  if (typeof cq.data !== "string") {
    await answerTelegramCallbackQuery(callbackId, "Невідома дія");
    return NextResponse.json({ ok: true });
  }

  const parsed = parseTelegramOrderCallback(cq.data);
  if (!parsed) {
    await answerTelegramCallbackQuery(callbackId, "Невідома дія");
    return NextResponse.json({ ok: true });
  }

  const admin = createAdminClient();
  const { data: order, error } = await admin
    .from("orders")
    .select("id, order_number, status, delivery_type")
    .eq("order_number", parsed.orderNumber)
    .maybeSingle();

  if (error || !order) {
    await answerTelegramCallbackQuery(callbackId, "Замовлення не знайдено", true);
    return NextResponse.json({ ok: true });
  }

  const current = order.status as OrderStatus;
  const deliveryType = order.delivery_type as DeliveryType;
  const next = resolveOrderStatusAfterTelegramAction(
    current,
    deliveryType,
    parsed.code,
  );

  if (!next) {
    await answerTelegramCallbackQuery(
      callbackId,
      "Дія недоступна для поточного статусу",
      true,
    );
    return NextResponse.json({ ok: true });
  }

  const { error: upErr } = await admin
    .from("orders")
    .update({ status: next, updated_at: new Date().toISOString() })
    .eq("id", order.id);

  if (upErr) {
    await answerTelegramCallbackQuery(callbackId, "Помилка збереження", true);
    return NextResponse.json({ ok: true });
  }

  revalidatePath("/admin");
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${order.id}`);

  const msg = cq.message as
    | { chat?: { id: number }; message_id?: number }
    | undefined;
  const chatId = msg?.chat?.id;
  const messageId = msg?.message_id;
  if (chatId != null && messageId != null) {
    const kb: TelegramInlineKeyboard =
      telegramOrderInlineKeyboard({
        order_number: order.order_number,
        status: next,
        delivery_type: deliveryType,
      }) ?? { inline_keyboard: [] };
    await editTelegramMessageReplyMarkup({
      chatId,
      messageId,
      replyMarkup: kb,
    });
  }

  await answerTelegramCallbackQuery(callbackId, "Статус оновлено");

  return NextResponse.json({ ok: true });
}
