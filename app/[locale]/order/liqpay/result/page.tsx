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

  if (dataB64 && signature && priv && liqpayVerify(dataB64, signature, priv)) {
    try {
      const payload = parseLiqPayPaymentPayload(dataB64);
      if (liqpayPaymentIsPaid(payload.status ?? "")) {
        const result = await confirmLiqPayFromPayload(payload, {
          notifyTelegram: true,
        });
        paid = result.paid;
        orderNumber = result.orderNumber;
      }
    } catch {
      paid = false;
    }
  } else if (pending) {
    try {
      const result = await confirmLiqPayFromPendingCookie(pending);
      paid = result.paid;
      orderNumber = result.orderNumber;
    } catch {
      paid = false;
    }
  }

  const orderNumberOk = Number.isFinite(orderNumber) && orderNumber > 0;

  if (paid && orderNumberOk) {
    redirect(`/order/${orderNumber}?thanks=1&paid=1`);
  }

  if (!dataB64 && !signature) {
    return (
      <LiqPayResultPending
        orderNumber={pending?.orderNumber}
      />
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center sm:px-6 sm:py-24">
      <h1 className="h-section">{te("paymentFailed")}</h1>
      <p className="text-body-muted mt-4">{t("thanksPaidSub")}</p>
      <Link href="/catalog/bouquets" className="btn-pill mt-10 inline-flex">
        До каталогу
      </Link>
    </div>
  );
}
