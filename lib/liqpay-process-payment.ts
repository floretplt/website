import { createAdminClient } from "@/lib/supabase/admin";
import { orderIdFromLiqPayOrderId } from "@/lib/liqpay-build-order-checkout";
import { decodeLiqPayData } from "@/lib/liqpay";
import { buildPrepayConfirmedTelegramCaptionUk } from "@/lib/order-telegram-caption";
import { publicAssetAbsoluteUrl } from "@/lib/public-asset-url";
import { resolvePublicProductImageUrl } from "@/lib/product-image";
import { sendTelegramOrderCreated } from "@/lib/telegram";
import { telegramOrderInlineKeyboard } from "@/lib/telegram-order-keyboard";

export type LiqPayPaymentPayload = {
  order_id?: string;
  status?: string;
  transaction_id?: string;
  payment_id?: number;
  /** Echoed back by LiqPay — verified against stored order before marking paid. */
  amount?: number;
  currency?: string;
};

export function liqpayPaymentIsPaid(status: string | undefined): boolean {
  if (status === "success") return true;
  if (status === "sandbox" && process.env.NODE_ENV !== "production") {
    return true;
  }
  return false;
}

export function liqpayPaymentNotifyTelegram(status: string | undefined): boolean {
  return liqpayPaymentIsPaid(status);
}

/** LiqPay statuses where polling / retry will not help. */
export function liqpayPaymentIsTerminalFailure(status: string | undefined): boolean {
  return status === "failure" || status === "error" || status === "reversed";
}

/** Check DB paid state (e.g. callback arrived before browser return). */
export async function getOrderPaidStateByLiqPayOrderId(
  rawLiqpayOrderId: string | undefined,
): Promise<{ paid: boolean; orderNumber: number | null }> {
  if (!rawLiqpayOrderId) return { paid: false, orderNumber: null };

  const orderId = orderIdFromLiqPayOrderId(rawLiqpayOrderId);
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("orders")
    .select("order_number, paid")
    .eq("id", orderId)
    .maybeSingle();

  if (error || !data) return { paid: false, orderNumber: null };

  const row = data as { order_number: number; paid: boolean };
  return {
    paid: row.paid === true,
    orderNumber: row.order_number,
  };
}

export function liqpayTransactionId(payload: LiqPayPaymentPayload): string | null {
  if (payload.transaction_id) return String(payload.transaction_id);
  if (payload.payment_id != null) return String(payload.payment_id);
  return null;
}

type OrderAmountRow = {
  order_number: number;
  price_paid: number;
  currency: string;
  delivery_fee_uah: number | null;
  postcard_fee_uah: number | null;
};

async function loadOrderAmountRow(
  admin: ReturnType<typeof createAdminClient>,
  orderId: string,
): Promise<OrderAmountRow | null> {
  const { data, error } = await admin
    .from("orders")
    .select("order_number, price_paid, currency, delivery_fee_uah, postcard_fee_uah")
    .eq("id", orderId)
    .maybeSingle();
  if (error || !data) return null;
  return data as OrderAmountRow;
}

function expectedOrderTotal(row: OrderAmountRow): number {
  const fee =
    row.currency === "UAH" && row.delivery_fee_uah != null
      ? Number(row.delivery_fee_uah)
      : 0;
  const postcard =
    row.currency === "UAH" && row.postcard_fee_uah != null
      ? Number(row.postcard_fee_uah)
      : 0;
  return Number(row.price_paid) + fee + postcard;
}

/** Verify order exists and LiqPay amount/currency match stored total. */
async function liqpayPayloadMatchesOrder(
  admin: ReturnType<typeof createAdminClient>,
  orderId: string,
  payload: LiqPayPaymentPayload,
): Promise<boolean> {
  const row = await loadOrderAmountRow(admin, orderId);
  if (!row) return false;

  const expected = expectedOrderTotal(row);

  if (
    typeof payload.amount === "number" &&
    Number.isFinite(payload.amount) &&
    Math.abs(payload.amount - expected) > 0.01
  ) {
    console.error("LiqPay amount mismatch — not marking paid", {
      orderId,
      order_number: row.order_number,
      expected,
      got: payload.amount,
    });
    return false;
  }

  if (typeof payload.currency === "string" && payload.currency !== row.currency) {
    console.error("LiqPay currency mismatch — not marking paid", {
      orderId,
      expected: row.currency,
      got: payload.currency,
    });
    return false;
  }

  return true;
}

/** Mark order paid and optionally notify staff (idempotent). */
export async function processLiqPayPayment(
  payload: LiqPayPaymentPayload,
  opts: { notifyTelegram: boolean },
): Promise<{ orderNumber: number | null; markedPaid: boolean }> {
  const rawOrderId = payload.order_id;
  if (!rawOrderId) return { orderNumber: null, markedPaid: false };

  const orderId = orderIdFromLiqPayOrderId(rawOrderId);
  const markPaid = liqpayPaymentIsPaid(payload.status);

  if (!markPaid) return { orderNumber: null, markedPaid: false };

  const admin = createAdminClient();

  if (!(await liqpayPayloadMatchesOrder(admin, orderId, payload))) {
    return { orderNumber: null, markedPaid: false };
  }

  const txId = liqpayTransactionId(payload);

  const { data: order, error } = await admin
    .from("orders")
    .update({
      paid: true,
      liqpay_order_id: txId,
    })
    .eq("id", orderId)
    .eq("paid", false)
    .select(
      [
        "order_number",
        "product_name",
        "product_size",
        "price_paid",
        "currency",
        "customer_name",
        "customer_phone",
        "delivery_type",
        "delivery_date",
        "delivery_time",
        "delivery_address",
        "recipient_phone",
        "gift_message",
        "notes",
        "delivery_fee_uah",
        "postcard_fee_uah",
        "prefer_messenger_contact",
        "product_image_url",
        "payment_method",
      ].join(", "),
    )
    .maybeSingle();

  if (error || !order) {
    const { data: existing } = await admin
      .from("orders")
      .select("order_number, paid")
      .eq("id", orderId)
      .maybeSingle();
    if (existing?.paid) {
      return {
        orderNumber: (existing as { order_number: number }).order_number,
        markedPaid: false,
      };
    }
    return { orderNumber: null, markedPaid: false };
  }

  const o = order as unknown as {
    order_number: number;
    product_name: string;
    product_size: string | null;
    price_paid: number;
    currency: string;
    customer_name: string;
    customer_phone: string;
    delivery_type: "pickup" | "delivery";
    delivery_date: string | null;
    delivery_time: string | null;
    delivery_address: string | null;
    recipient_phone: string | null;
    gift_message: string | null;
    notes: string | null;
    delivery_fee_uah: number | null;
    postcard_fee_uah: number | null;
    prefer_messenger_contact: boolean;
    product_image_url: string | null;
    payment_method: string;
  };

  const notify =
    opts.notifyTelegram && liqpayPaymentNotifyTelegram(payload.status);

  if (notify && o.payment_method === "prepay") {
    const bouquet = Number(o.price_paid);
    const fee =
      o.currency === "UAH" && o.delivery_fee_uah != null
        ? Number(o.delivery_fee_uah)
        : 0;
    const pc =
      o.currency === "UAH" && o.postcard_fee_uah != null
        ? Number(o.postcard_fee_uah)
        : 0;
    const totalPaid = bouquet + fee + pc;

    const caption = buildPrepayConfirmedTelegramCaptionUk({
      orderNumber: o.order_number,
      productName: o.product_name,
      productSize: o.product_size,
      pricePaid: bouquet,
      currency: o.currency,
      customerName: o.customer_name,
      customerPhone: o.customer_phone,
      deliveryType: o.delivery_type,
      deliveryDate: o.delivery_date,
      deliveryTime: o.delivery_time,
      deliveryAddress: o.delivery_address,
      recipientPhone: o.recipient_phone,
      giftMessage: o.gift_message,
      notes: o.notes,
      deliveryFeeUah: o.currency === "UAH" ? o.delivery_fee_uah : null,
      postcardFeeUah: o.currency === "UAH" ? o.postcard_fee_uah : null,
      preferMessengerContact: o.prefer_messenger_contact === true,
      totalPaid,
      liqpayTransactionId: txId,
    });

    const photoUrl = publicAssetAbsoluteUrl(
      resolvePublicProductImageUrl(o.product_image_url),
    );

    await sendTelegramOrderCreated({
      caption,
      photoUrl,
      replyMarkup: telegramOrderInlineKeyboard({
        order_number: o.order_number,
        status: "new",
        delivery_type: o.delivery_type,
      }),
    });
  }

  return { orderNumber: o.order_number, markedPaid: true };
}

export function parseLiqPayPaymentPayload(dataBase64: string): LiqPayPaymentPayload {
  return decodeLiqPayData<LiqPayPaymentPayload>(dataBase64);
}
