import { createAdminClient } from "@/lib/supabase/admin";
import { buildPrepayCheckoutStartedCaptionUk } from "@/lib/order-telegram-caption";
import { sendTelegramMessage } from "@/lib/telegram";

type OrderTelegramRow = {
  order_number: number;
  payment_method: string;
  paid: boolean;
};

async function loadOrder(orderId: string): Promise<OrderTelegramRow | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("orders")
    .select("order_number, payment_method, paid")
    .eq("id", orderId)
    .maybeSingle();
  if (error || !data) {
    console.error("telegram prepay loadOrder", { orderId, error: error?.message });
    return null;
  }
  return data as OrderTelegramRow;
}

/** Stage 2: client redirected to LiqPay checkout (optional follow-up after full order alert). */
export async function notifyPrepayCheckoutStarted(
  orderId: string,
  amount: number,
  currency: "UAH" | "EUR",
): Promise<boolean> {
  const row = await loadOrder(orderId);
  if (!row || row.payment_method !== "prepay" || row.paid) return false;

  const caption = buildPrepayCheckoutStartedCaptionUk({
    orderNumber: row.order_number,
    amount,
    currency,
  });
  const ok = await sendTelegramMessage(caption);
  if (!ok) console.error("telegram prepay checkout started failed", { orderId });
  return ok;
}
