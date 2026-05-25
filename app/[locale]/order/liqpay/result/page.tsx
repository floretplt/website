import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { LiqPayResultPending } from "@/components/shop/LiqPayResultPending";
import { liqpayVerify } from "@/lib/liqpay";
import {
  confirmLiqPayFromPayload,
  confirmLiqPayFromPendingCookie,
} from "@/lib/liqpay-confirm-pending";
import {
  FLORET_LIQPAY_COOKIE,
  parsePendingLiqPayCookie,
} from "@/lib/liqpay-pending-cookie";
import {
  getOrderPaidStateByLiqPayOrderId,
  liqpayPaymentIsPaid,
  parseLiqPayPaymentPayload,
} from "@/lib/liqpay-process-payment";

function firstString(
  v: string | string[] | undefined,
): string | undefined {
  if (typeof v === "string") return v;
  if (Array.isArray(v) && v.length > 0) return v[0];
  return undefined;
}

export default async function LiqPayResultPage({
  searchParams,
}: {
  params: { locale: string };
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const dataB64 = firstString(searchParams.data);
  const signature = firstString(searchParams.signature);
  const priv = process.env.LIQPAY_PRIVATE_KEY;
  const pending = parsePendingLiqPayCookie(
    cookies().get(FLORET_LIQPAY_COOKIE)?.value,
  );

  let paid = false;
  let orderNumber = 0;

  const verifiedReturn = Boolean(
    dataB64 && signature && priv && liqpayVerify(dataB64, signature, priv),
  );

  if (verifiedReturn && dataB64 && signature) {
    try {
      const payload = parseLiqPayPaymentPayload(dataB64);

      const dbState = await getOrderPaidStateByLiqPayOrderId(payload.order_id);
      if (dbState.paid && dbState.orderNumber != null) {
        paid = true;
        orderNumber = dbState.orderNumber;
      }

      if (!paid && liqpayPaymentIsPaid(payload.status ?? "")) {
        const result = await confirmLiqPayFromPayload(payload, {
          notifyTelegram: true,
        });
        paid = result.paid;
        orderNumber = result.orderNumber;
      }
    } catch (e) {
      console.error("liqpay result confirm", e);
    }
  }

  if (!paid && pending) {
    try {
      const dbState = await getOrderPaidStateByLiqPayOrderId(pending.liqpayOrderId);
      if (dbState.paid && dbState.orderNumber != null) {
        paid = true;
        orderNumber = dbState.orderNumber;
      }

      if (!paid) {
        const result = await confirmLiqPayFromPendingCookie(pending);
        paid = result.paid;
        if (result.orderNumber > 0) orderNumber = result.orderNumber;
      }
    } catch (e) {
      console.error("liqpay result pending confirm", e);
    }
  }

  const orderNumberOk = Number.isFinite(orderNumber) && orderNumber > 0;

  if (paid && orderNumberOk) {
    redirect(`/order/${orderNumber}?thanks=1&paid=1`);
  }

  return (
    <LiqPayResultPending
      orderNumber={pending?.orderNumber ?? (orderNumberOk ? orderNumber : undefined)}
      returnData={verifiedReturn ? dataB64 : undefined}
      returnSignature={verifiedReturn ? signature : undefined}
    />
  );
}
