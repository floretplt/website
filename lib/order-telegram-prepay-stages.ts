import { createAdminClient } from "@/lib/supabase/admin";
import {
  buildPrepayAwaitingPaymentCaptionUk,
  buildPrepayCheckoutStartedCaptionUk,
} from "@/lib/order-telegram-caption";
import { sendTelegramMessage } from "@/lib/telegram";

type OrderTelegramRow = {
  order_number: number;
  product_name: string;
  product_size: string | null;
  price_paid: number;
  currency: string;
  customer_name: string;
  customer_phone: string;
  delivery_fee_uah: number | null;
  postcard_fee_uah: number | null;
  payment_method: string;
  paid: boolean;
};

async function loadOrder(orderId: string): Promise<OrderTelegramRow | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("orders")
    .select(
      "order_number, product_name, product_size, price_paid, currency, customer_name, customer_phone, delivery_fee_uah, postcard_fee_uah, payment_method, paid",
    )
    .eq("id", orderId)
    .maybeSingle();
  if (error || !data) return null;
  return data as OrderTelegramRow;
}

function totalDueUah(row: OrderTelegramRow): number {
  const bouquet = Number(row.price_paid);
  const fee =
    row.currency === "UAH" && row.delivery_fee_uah != null
      ? Number(row.delivery_fee_uah)
      : 0;
  const pc =
    row.currency === "UAH" && row.postcard_fee_uah != null
      ? Number(row.postcard_fee_uah)
      : 0;
  return bouquet + fee + pc;
}

/** Stage 1: prepay order created in DB (before LiqPay). */
export async function notifyPrepayOrderCreated(orderId: string): Promise<void> {
  const row = await loadOrder(orderId);
  if (!row || row.payment_method !== "prepay" || row.paid) return;

  const caption = buildPrepayAwaitingPaymentCaptionUk({
    orderNumber: row.order_number,
    productName: row.product_name,
    productSize: row.product_size,
    totalDueUah: totalDueUah(row),
    currency: row.currency === "EUR" ? "EUR" : "UAH",
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
  });
  await sendTelegramMessage(caption);
}

/** Stage 2: client redirected to LiqPay checkout. */
export async function notifyPrepayCheckoutStarted(
  orderId: string,
  amount: number,
  currency: "UAH" | "EUR",
): Promise<void> {
  const row = await loadOrder(orderId);
  if (!row || row.payment_method !== "prepay" || row.paid) return;

  const caption = buildPrepayCheckoutStartedCaptionUk({
    orderNumber: row.order_number,
    amount,
    currency,
  });
  await sendTelegramMessage(caption);
}
