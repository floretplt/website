import type { DeliveryType, OrderStatus } from "@/lib/constants";

export type TelegramInlineKeyboard = {
  inline_keyboard: { text: string; callback_data: string }[][];
};

function cb(orderNumber: number, code: string) {
  return `o:${orderNumber}:${code}`;
}

/** Inline actions for new-order Telegram messages (synced with DB status). */
export function telegramOrderInlineKeyboard(order: {
  order_number: number;
  status: OrderStatus;
  delivery_type: DeliveryType;
}): TelegramInlineKeyboard | undefined {
  const rows: { text: string; callback_data: string }[][] = [];
  const { status, delivery_type: dt, order_number: num } = order;

  if (status === "new") {
    rows.push([{ text: "У роботу", callback_data: cb(num, "p") }]);
  } else if (status === "in_progress") {
    rows.push([{ text: "Готово", callback_data: cb(num, "r") }]);
  } else if (status === "ready") {
    if (dt === "delivery") {
      rows.push([
        { text: "У дорозі", callback_data: cb(num, "o") },
        { text: "Завершено", callback_data: cb(num, "c") },
      ]);
    } else {
      rows.push([{ text: "Завершено", callback_data: cb(num, "c") }]);
    }
  } else if (status === "out_for_delivery") {
    rows.push([{ text: "Завершено", callback_data: cb(num, "c") }]);
  }

  if (rows.length === 0) return undefined;
  return { inline_keyboard: rows };
}

export function parseTelegramOrderCallback(
  data: string,
): { orderNumber: number; code: string } | null {
  const m = /^o:(\d+):([prco])$/.exec(data.trim());
  if (!m) return null;
  return { orderNumber: Number(m[1]), code: m[2] };
}
