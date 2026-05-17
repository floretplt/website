import { escapeHtml } from "@/lib/html-escape";
import { formatStoredDeliveryTimeUk } from "@/lib/order-delivery-time-telegram";
import { bouquetSizeLetter } from "@/lib/order-format";
import type { z } from "zod";
import { orderCreateSchema } from "@/lib/validators";

type OrderCreate = z.infer<typeof orderCreateSchema>;

export function buildNewOrderTelegramCaptionUk(params: {
  data: OrderCreate;
  orderNumber: number;
  mergedAddress: string | null;
  deliveryFeeUah: number | null;
  postcardFeeUah: number | null;
  totalDueUah: number;
}): string {
  const {
    data,
    orderNumber,
    mergedAddress,
    deliveryFeeUah,
    postcardFeeUah,
    totalDueUah,
  } = params;
  const reserve = data.payment_method === "reserve";
  const paymentLabel = reserve ? "Бронь" : "Передоплата";
  const size = bouquetSizeLetter(data.product_size);

  const lines: string[] = [
    `<b>Нове замовлення #${orderNumber}</b>`,
    `(${paymentLabel})`,
    "",
    `<b>Товар:</b> ${escapeHtml(data.product_name)}`,
    `<b>Розмір:</b> ${size}`,
    `<b>Букет:</b> ${data.price_paid} ${data.currency}`,
  ];

  if (data.currency === "UAH") {
    if (deliveryFeeUah != null) {
      lines.push(`<b>Доставка (кур’єр):</b> ${deliveryFeeUah} UAH`);
    }
    if ((postcardFeeUah ?? 0) > 0) {
      lines.push(`<b>Листівка:</b> ${postcardFeeUah} UAH`);
    }
    lines.push(`<b>Разом до сплати:</b> ${totalDueUah.toFixed(0)} UAH`);
  }

  lines.push("");
  lines.push(
    `<b>Клієнт:</b> ${escapeHtml(data.customer_name)} ${escapeHtml(data.customer_phone)}`,
  );
  if (data.prefer_messenger_contact) {
    lines.push(
      "<b>Зв’язок:</b> не дзвонити — напишіть у Viber / WhatsApp / Telegram",
    );
  }
  const delKind = data.delivery_type === "delivery" ? "Доставка" : "Самовивіз";
  lines.push(`<b>Тип:</b> ${delKind}`);

  const timeUk = formatStoredDeliveryTimeUk(data.delivery_time ?? null);

  if (data.delivery_type === "delivery") {
    lines.push(
      `<b>Дата / час:</b> ${escapeHtml(String(data.delivery_date ?? ""))} ${escapeHtml(timeUk)}`,
    );
    if (mergedAddress) {
      lines.push(`<b>Адреса:</b> ${escapeHtml(mergedAddress)}`);
    }
    if (data.recipient_phone) {
      lines.push(
        `<b>Тел. отримувача:</b> ${escapeHtml(data.recipient_phone)}`,
      );
    }
  } else {
    lines.push(
      `<b>Дата / час самовивозу:</b> ${escapeHtml(String(data.delivery_date ?? ""))} ${escapeHtml(timeUk)}`,
    );
  }

  if (data.gift_message?.trim()) {
    lines.push(
      `<b>Текст листівки:</b> ${escapeHtml(data.gift_message.trim())}`,
    );
  }
  if (data.notes?.trim()) {
    lines.push(`<b>Примітки:</b> ${escapeHtml(data.notes.trim())}`);
  }

  return lines.join("\n");
}

/** Prepay: order saved, client has not opened LiqPay yet. */
export function buildPrepayAwaitingPaymentCaptionUk(params: {
  orderNumber: number;
  productName: string;
  productSize: string | null;
  totalDueUah: number;
  currency: string;
  customerName: string;
  customerPhone: string;
}): string {
  const size = bouquetSizeLetter(params.productSize);
  return [
    `<b>🛒 Оформлення #${params.orderNumber}</b>`,
    `<i>Передоплата — очікуємо оплату на LiqPay</i>`,
    "",
    `<b>Товар:</b> ${escapeHtml(params.productName)} · ${size}`,
    `<b>До сплати:</b> ${params.totalDueUah.toFixed(0)} ${params.currency}`,
    `<b>Клієнт:</b> ${escapeHtml(params.customerName)} ${escapeHtml(params.customerPhone)}`,
  ].join("\n");
}

/** Prepay: client opened LiqPay checkout (redirect from site). */
export function buildPrepayCheckoutStartedCaptionUk(params: {
  orderNumber: number;
  amount: number;
  currency: string;
}): string {
  return [
    `<b>💳 Оплата на LiqPay #${params.orderNumber}</b>`,
    `<i>Клієнт на сторінці оплати</i>`,
    `<b>Сума:</b> ${params.amount.toFixed(2)} ${params.currency}`,
  ].join("\n");
}

/** Telegram caption after LiqPay server callback confirms payment (status success). */
export function buildPrepayConfirmedTelegramCaptionUk(params: {
  orderNumber: number;
  productName: string;
  productSize: string | null;
  pricePaid: number;
  currency: string;
  customerName: string;
  customerPhone: string;
  deliveryType: "pickup" | "delivery";
  deliveryDate: string | null;
  deliveryTime: string | null;
  deliveryAddress: string | null;
  recipientPhone: string | null;
  giftMessage: string | null;
  notes: string | null;
  deliveryFeeUah: number | null;
  postcardFeeUah: number | null;
  preferMessengerContact: boolean;
  /** Total amount confirmed by LiqPay (same currency as `currency`). */
  totalPaid: number;
  liqpayTransactionId?: string | null;
}): string {
  const size = bouquetSizeLetter(params.productSize);
  const timeUk = formatStoredDeliveryTimeUk(params.deliveryTime);

  const lines: string[] = [
    `<b>✅ Оплачено замовлення #${params.orderNumber}</b>`,
    `<b>Платіж отримано</b> (LiqPay) — замовлення можна брати в роботу.`,
    "",
    `<b>Товар:</b> ${escapeHtml(params.productName)}`,
    `<b>Розмір:</b> ${size}`,
    `<b>Букет:</b> ${params.pricePaid} ${params.currency}`,
  ];

  if (params.currency === "UAH") {
    if (params.deliveryFeeUah != null) {
      lines.push(`<b>Доставка (кур’єр):</b> ${params.deliveryFeeUah} UAH`);
    }
    if ((params.postcardFeeUah ?? 0) > 0) {
      lines.push(`<b>Листівка:</b> ${params.postcardFeeUah} UAH`);
    }
    lines.push(
      `<b>Сплачено загалом:</b> ${params.totalPaid.toFixed(0)} UAH`,
    );
  } else {
    lines.push(
      `<b>Сплачено загалом:</b> ${params.totalPaid.toFixed(2)} ${params.currency}`,
    );
  }

  if (params.liqpayTransactionId) {
    lines.push(`<b>ID транзакції LiqPay:</b> ${escapeHtml(params.liqpayTransactionId)}`);
  }

  lines.push("");
  lines.push(
    `<b>Клієнт:</b> ${escapeHtml(params.customerName)} ${escapeHtml(params.customerPhone)}`,
  );
  if (params.preferMessengerContact) {
    lines.push(
      "<b>Зв’язок:</b> не дзвонити — напишіть у Viber / WhatsApp / Telegram",
    );
  }
  const delKind = params.deliveryType === "delivery" ? "Доставка" : "Самовивіз";
  lines.push(`<b>Тип:</b> ${delKind}`);

  if (params.deliveryType === "delivery") {
    lines.push(
      `<b>Дата / час:</b> ${escapeHtml(String(params.deliveryDate ?? ""))} ${escapeHtml(timeUk)}`,
    );
    if (params.deliveryAddress) {
      lines.push(`<b>Адреса:</b> ${escapeHtml(params.deliveryAddress)}`);
    }
    if (params.recipientPhone) {
      lines.push(
        `<b>Тел. отримувача:</b> ${escapeHtml(params.recipientPhone)}`,
      );
    }
  } else {
    lines.push(
      `<b>Дата / час самовивозу:</b> ${escapeHtml(String(params.deliveryDate ?? ""))} ${escapeHtml(timeUk)}`,
    );
  }

  if (params.giftMessage?.trim()) {
    lines.push(
      `<b>Текст листівки:</b> ${escapeHtml(params.giftMessage.trim())}`,
    );
  }
  if (params.notes?.trim()) {
    lines.push(`<b>Примітки:</b> ${escapeHtml(params.notes.trim())}`);
  }

  return lines.join("\n");
}
