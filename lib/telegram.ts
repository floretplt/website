import type { TelegramInlineKeyboard } from "@/lib/telegram-order-keyboard";

function telegramEnv() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  return { token, chatId };
}

async function telegramPost(method: string, body: Record<string, unknown>) {
  const { token } = telegramEnv();
  if (!token) {
    console.warn("Telegram not configured");
    return { ok: false as const, skipped: true };
  }
  const url = `https://api.telegram.org/bot${token}/${method}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const t = await res.text();
    console.error(`Telegram ${method}`, t);
    return { ok: false as const, error: t };
  }
  return { ok: true as const, json: (await res.json()) as unknown };
}

/** @returns true if Telegram accepted the message */
export async function sendTelegramMessage(text: string): Promise<boolean> {
  const { token, chatId } = telegramEnv();
  if (!token || !chatId) {
    console.warn("Telegram not configured (TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID)");
    return false;
  }
  const res = await telegramPost("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
  });
  if (!res.ok && !("skipped" in res && res.skipped)) {
    console.error("Telegram sendMessage failed", res);
    return false;
  }
  return res.ok;
}

/**
 * New order notification: photo + caption + optional inline keyboard.
 * Falls back to sendMessage when no photo URL or sendPhoto fails.
 */
export async function sendTelegramOrderCreated(args: {
  caption: string;
  photoUrl?: string | null;
  replyMarkup?: TelegramInlineKeyboard;
}) {
  const { chatId } = telegramEnv();
  if (!chatId) {
    console.warn("Telegram not configured");
    return;
  }
  const payload: Record<string, unknown> = {
    chat_id: chatId,
    caption: args.caption,
    parse_mode: "HTML",
  };
  if (args.replyMarkup) {
    payload.reply_markup = args.replyMarkup;
  }

  if (args.photoUrl) {
    const photoRes = await telegramPost("sendPhoto", {
      ...payload,
      photo: args.photoUrl,
    });
    if (photoRes.ok) return;
    const detail = "error" in photoRes ? photoRes.error : "unknown error";
    console.warn("Telegram sendPhoto failed, falling back to sendMessage", {
      photoUrlPreview: args.photoUrl.slice(0, 120),
      detail,
    });
  }

  await telegramPost("sendMessage", {
    chat_id: chatId,
    text: args.caption,
    parse_mode: "HTML",
    ...(args.replyMarkup ? { reply_markup: args.replyMarkup } : {}),
  });
}

export async function answerTelegramCallbackQuery(
  callbackQueryId: string,
  text?: string,
  showAlert?: boolean,
) {
  await telegramPost("answerCallbackQuery", {
    callback_query_id: callbackQueryId,
    text: text?.slice(0, 200),
    show_alert: showAlert ?? false,
  });
}

export async function editTelegramMessageReplyMarkup(args: {
  chatId: number;
  messageId: number;
  replyMarkup: TelegramInlineKeyboard;
}) {
  await telegramPost("editMessageReplyMarkup", {
    chat_id: args.chatId,
    message_id: args.messageId,
    reply_markup: args.replyMarkup,
  });
}
