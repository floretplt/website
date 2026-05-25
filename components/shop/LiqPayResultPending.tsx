"use client";

import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { Link } from "@/i18n/navigation";
import {
  FLORET_LIQPAY_STORAGE_KEY,
  parsePendingLiqPayJson,
} from "@/lib/liqpay-pending-cookie";

const MAX_ATTEMPTS = 20;
const POLL_MS = 2000;

type Props = {
  orderNumber?: number;
  returnData?: string;
  returnSignature?: string;
};

export function LiqPayResultPending({
  orderNumber: orderNumberProp,
  returnData,
  returnSignature,
}: Props) {
  const t = useTranslations("order");
  const te = useTranslations("errors");
  const router = useRouter();
  const [attempt, setAttempt] = useState(0);
  const [displayNumber, setDisplayNumber] = useState(orderNumberProp ?? 0);
  const [exhausted, setExhausted] = useState(false);
  const done = useRef(false);

  useEffect(() => {
    if (done.current || exhausted) return;

    let cancelled = false;

    const run = async () => {
      const stored = parsePendingLiqPayJson(
        sessionStorage.getItem(FLORET_LIQPAY_STORAGE_KEY) ?? undefined,
      );
      if (stored?.orderNumber) {
        setDisplayNumber(stored.orderNumber);
      }

      const body: Record<string, unknown> = {};
      if (stored) {
        body.orderId = stored.orderId;
        body.orderNumber = stored.orderNumber;
        body.liqpayOrderId = stored.liqpayOrderId;
      }
      if (returnData && returnSignature) {
        body.data = returnData;
        body.signature = returnSignature;
      }

      try {
        const res = await fetch("/api/liqpay/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: Object.keys(body).length > 0 ? JSON.stringify(body) : undefined,
        });
        const json = (await res.json()) as {
          paid?: boolean;
          orderNumber?: number;
        };
        if (cancelled || done.current) return;
        if (json.paid && json.orderNumber) {
          done.current = true;
          try {
            sessionStorage.removeItem(FLORET_LIQPAY_STORAGE_KEY);
          } catch {
            /* ignore */
          }
          router.replace(`/order/${json.orderNumber}?thanks=1&paid=1`);
          return;
        }
      } catch {
        /* retry */
      }

      if (!cancelled && !done.current) {
        if (attempt < MAX_ATTEMPTS) {
          window.setTimeout(() => setAttempt((a) => a + 1), POLL_MS);
        } else {
          setExhausted(true);
        }
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [attempt, router, returnData, returnSignature, exhausted]);

  if (exhausted) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center sm:px-6 sm:py-24">
        <h1 className="h-section">{te("paymentFailed")}</h1>
        <p className="text-body-muted mt-4">{te("paymentFailedHint")}</p>
        {displayNumber > 0 ? (
          <p className="text-body-muted mt-2">
            {t("thanksPaidLead", { orderNumber: displayNumber })}
          </p>
        ) : null}
        <Link href="/catalog/bouquets" className="btn-pill mt-10 inline-flex">
          До каталогу
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center sm:px-6 sm:py-24">
      <h1 className="h-section">{t("thanksPaidTitle")}</h1>
      <p className="text-body-muted mt-6">
        {displayNumber > 0
          ? `Перевіряємо оплату замовлення №${displayNumber}…`
          : "Перевіряємо оплату…"}
      </p>
    </div>
  );
}
