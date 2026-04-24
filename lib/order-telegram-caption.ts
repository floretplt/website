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
