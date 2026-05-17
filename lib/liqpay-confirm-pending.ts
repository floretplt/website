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
  return {
    paid: markedPaid || orderNumber != null,
    orderNumber: orderNumber ?? 0,
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
    },
    { notifyTelegram: true },
  );
}
