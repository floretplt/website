import { liqpayApiRequest } from "@/lib/liqpay-api-request";
import type { PendingLiqPayCookie } from "@/lib/liqpay-pending-cookie";
import {
  liqpayPaymentIsPaid,
  processLiqPayPayment,
  type LiqPayPaymentPayload,
} from "@/lib/liqpay-process-payment";

export type ConfirmLiqPayResult = {
  paid: boolean;
  orderNumber: number;
  status?: string;
};

export async function confirmLiqPayFromPayload(
  payload: LiqPayPaymentPayload,
  opts: { notifyTelegram: boolean },
): Promise<ConfirmLiqPayResult> {
  const status = payload.status ?? "";
  if (!liqpayPaymentIsPaid(status)) {
    return { paid: false, orderNumber: 0, status };
  }

  const { orderNumber, markedPaid } = await processLiqPayPayment(payload, opts);
  const num = orderNumber ?? 0;
  return {
    paid: markedPaid || num > 0,
    orderNumber: num,
    status,
  };
}

/** When LiqPay return has no data/signature (manual “back to site”), poll status API. */
export async function confirmLiqPayFromPendingCookie(
  pending: PendingLiqPayCookie,
): Promise<ConfirmLiqPayResult> {
  const remote = await liqpayApiRequest("status", {
    order_id: pending.liqpayOrderId,
  });
  const status = String(remote.status ?? "");

  if (!liqpayPaymentIsPaid(status)) {
    return { paid: false, orderNumber: pending.orderNumber, status };
  }

  const amount =
    typeof remote.amount === "number"
      ? remote.amount
      : typeof remote.amount === "string"
        ? Number(remote.amount)
        : undefined;
  const currency =
    typeof remote.currency === "string" ? remote.currency : undefined;

  return confirmLiqPayFromPayload(
    {
      order_id: pending.liqpayOrderId,
      status,
      transaction_id:
        typeof remote.transaction_id === "string"
          ? remote.transaction_id
          : undefined,
      payment_id:
        typeof remote.payment_id === "number" ? remote.payment_id : undefined,
      amount: Number.isFinite(amount) ? amount : undefined,
      currency,
    },
    { notifyTelegram: true },
  );
}
