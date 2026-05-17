import { createAdminClient } from "@/lib/supabase/admin";
import {
  getLiqPayCheckoutUrl,
  liqpayCreateCheckoutRedirect,
  liqpayEncode,
  liqpaySign,
} from "@/lib/liqpay";

const LIQPAY_ORDER_SEP = "__";

/** Map LiqPay `order_id` back to our orders.id (UUID). */
export function orderIdFromLiqPayOrderId(liqpayOrderId: string): string {
  const sep = liqpayOrderId.indexOf(LIQPAY_ORDER_SEP);
  if (sep > 0) return liqpayOrderId.slice(0, sep);
  return liqpayOrderId;
}

/** Unique LiqPay order_id per payment attempt (required for retries). */
export function liqpayOrderIdForAttempt(orderUuid: string): string {
  return `${orderUuid}${LIQPAY_ORDER_SEP}${Date.now()}`;
}

export type LiqPaySignedPayload = {
  data: string;
  signature: string;
  checkoutUrl: string;
  orderNumber: number;
  liqpayOrderId: string;
  amount: number;
  currency: "UAH" | "EUR";
};

export type LiqPayOrderCheckout =
  | ({ ok: true } & LiqPaySignedPayload)
  | { ok: true; redirectUrl: string }
  | { ok: false; status: number; error: string };

type OrderRow = {
  id: string;
  order_number: number;
  price_paid: number;
  currency: string;
  paid: boolean;
  payment_method: string;
  customer_phone: string | null;
  delivery_fee_uah?: number | null;
  postcard_fee_uah?: number | null;
};

async function loadPrepayOrder(orderUuid: string): Promise<
  | { ok: true; order: OrderRow; amount: number; currency: "UAH" | "EUR" }
  | { ok: false; status: number; error: string }
> {
  const admin = createAdminClient();
  const { data: order, error } = await admin
    .from("orders")
    .select("*")
    .eq("id", orderUuid)
    .single();

  if (error || !order) {
    return { ok: false, status: 404, error: "Order not found" };
  }

  const row = order as OrderRow;

  if (row.paid) {
    return { ok: false, status: 400, error: "Already paid" };
  }

  if (row.payment_method !== "prepay") {
    return { ok: false, status: 400, error: "Wrong payment method" };
  }

  const bouquet = Number(row.price_paid);
  const feeRaw = row.delivery_fee_uah;
  const fee =
    row.currency === "UAH" && feeRaw != null && Number.isFinite(Number(feeRaw))
      ? Number(feeRaw)
      : 0;
  const pcRaw = row.postcard_fee_uah;
  const postcard =
    row.currency === "UAH" && pcRaw != null && Number.isFinite(Number(pcRaw))
      ? Number(pcRaw)
      : 0;
  const amount = bouquet + fee + postcard;
  const currency = row.currency === "EUR" ? "EUR" : "UAH";

  if (!Number.isFinite(amount) || amount < 1) {
    return { ok: false, status: 400, error: "Amount too low for online payment" };
  }

  return { ok: true, order: row, amount, currency };
}

function buildSignedPayload(
  order: OrderRow,
  amount: number,
  currency: "UAH" | "EUR",
): LiqPaySignedPayload | { error: string } {
  const pub = process.env.NEXT_PUBLIC_LIQPAY_PUBLIC_KEY;
  const priv = process.env.LIQPAY_PRIVATE_KEY;
  const site = (
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
  ).replace(/\/$/, "");
  /** LiqPay servers POST here when payment completes (must be public HTTPS in prod). */
  const serverUrl = (
    process.env.LIQPAY_SERVER_URL?.trim() || `${site}/api/liqpay/callback`
  ).replace(/\/$/, "");

  if (!pub || !priv) {
    return { error: "LiqPay not configured" };
  }

  const dataObj: Record<string, string | number> = {
    public_key: pub,
    version: 3,
    action: "pay",
    amount: Number(amount.toFixed(2)),
    currency,
    description: `Floret #${order.order_number}`,
    order_id: liqpayOrderIdForAttempt(order.id),
    result_url: `${site}/api/liqpay/return`,
    server_url: serverUrl,
    language: "uk",
  };

  const customerPhone =
    typeof order.customer_phone === "string"
      ? order.customer_phone.replace(/\D/g, "")
      : "";
  if (customerPhone.length >= 10) {
    dataObj.phone = customerPhone;
  }

  const data = liqpayEncode(dataObj);
  const signature = liqpaySign(data, priv);

  return {
    data,
    signature,
    checkoutUrl: getLiqPayCheckoutUrl(),
    orderNumber: order.order_number,
    liqpayOrderId: String(dataObj.order_id),
    amount,
    currency,
  };
}

/** Signed payload for browser POST to LiqPay. */
export async function buildLiqPayCardPayload(
  orderUuid: string,
): Promise<LiqPayOrderCheckout> {
  const loaded = await loadPrepayOrder(orderUuid);
  if (!loaded.ok) return loaded;

  const signed = buildSignedPayload(
    loaded.order,
    loaded.amount,
    loaded.currency,
  );
  if ("error" in signed) {
    return { ok: false, status: 503, error: signed.error };
  }

  return { ok: true, ...signed };
}

export async function buildLiqPayCheckoutForOrder(
  orderUuid: string,
  opts?: { returnLink?: boolean },
): Promise<LiqPayOrderCheckout> {
  if (opts?.returnLink) {
    const loaded = await loadPrepayOrder(orderUuid);
    if (!loaded.ok) return loaded;

    const signed = buildSignedPayload(
      loaded.order,
      loaded.amount,
      loaded.currency,
    );
    if ("error" in signed) {
      return { ok: false, status: 503, error: signed.error };
    }

    const checkout = await liqpayCreateCheckoutRedirect(
      signed.data,
      signed.signature,
    );
    if ("error" in checkout) {
      return { ok: false, status: 502, error: "LiqPay checkout failed" };
    }
    return { ok: true, redirectUrl: checkout.redirectUrl };
  }

  return buildLiqPayCardPayload(orderUuid);
}
