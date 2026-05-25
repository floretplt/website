import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { Link } from "@/i18n/navigation";
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
  liqpayPaymentIsTerminalFailure,
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
  params,
  searchParams,
}: {
  params: { locale: string };
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const locale = params.locale;
  const t = await getTranslations({ locale, namespace: "order" });
  const te = await getTranslations({ locale, namespace: "errors" });

  const dataB64 = firstString(searchParams.data);
  const signature = firstString(searchParams.signature);
  const priv = process.env.LIQPAY_PRIVATE_KEY;
  const pending = parsePendingLiqPayCookie(
    cookies().get(FLORET_LIQPAY_COOKIE)?.value,
  );

  let paid = false;
  let orderNumber = 0;
  let returnStatus: string | undefined;
  let hasVerifiedReturn = false;

  if (dataB64 && signature && priv && liqpayVerify(dataB64, signature, priv)) {
    hasVerifiedReturn = true;
    try {
      const payload = parseLiqPayPaymentPayload(dataB64);
      returnStatus = payload.status;

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
        returnStatus = result.status ?? returnStatus;
      }
    } catch (e) {
      console.error("liqpay result confirm", e);
      paid = false;
    }
  }

  if (!paid && pending) {
    try {
      const result = await confirmLiqPayFromPendingCookie(pending);
      paid = result.paid;
      if (result.orderNumber > 0) orderNumber = result.orderNumber;
      if (!returnStatus && result.status) returnStatus = result.status;
    } catch (e) {
      console.error("liqpay result pending confirm", e);
    }
  }

  if (!paid && pending) {
    const dbState = await getOrderPaidStateByLiqPayOrderId(pending.liqpayOrderId);
    if (dbState.paid && dbState.orderNumber != null) {
      paid = true;
      orderNumber = dbState.orderNumber;
    }
  }

  const orderNumberOk = Number.isFinite(orderNumber) && orderNumber > 0;

  if (paid && orderNumberOk) {
    redirect(`/order/${orderNumber}?thanks=1&paid=1`);
  }

  const terminalFailure =
    returnStatus != null && liqpayPaymentIsTerminalFailure(returnStatus);

  if (!hasVerifiedReturn || !terminalFailure) {
    return (
      <LiqPayResultPending
        orderNumber={pending?.orderNumber ?? (orderNumberOk ? orderNumber : undefined)}
      />
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center sm:px-6 sm:py-24">
      <h1 className="h-section">{te("paymentFailed")}</h1>
      <p className="text-body-muted mt-4">{te("paymentFailedHint")}</p>
      {orderNumberOk ? (
        <p className="text-body-muted mt-2">
          {t("thanksPaidLead", { orderNumber })}
        </p>
      ) : null}
      <Link href="/catalog/bouquets" className="btn-pill mt-10 inline-flex">
        До каталогу
      </Link>
    </div>
  );
}
