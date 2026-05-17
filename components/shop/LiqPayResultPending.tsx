"use client";

import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import {
  FLORET_LIQPAY_STORAGE_KEY,
  parsePendingLiqPayJson,
} from "@/lib/liqpay-pending-cookie";

type Props = {
  orderNumber?: number;
};

export function LiqPayResultPending({ orderNumber: orderNumberProp }: Props) {
  const t = useTranslations("order");
  const router = useRouter();
  const [attempt, setAttempt] = useState(0);
  const [displayNumber, setDisplayNumber] = useState(orderNumberProp ?? 0);
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;

    let cancelled = false;

    const run = async () => {
      const stored = parsePendingLiqPayJson(
        sessionStorage.getItem(FLORET_LIQPAY_STORAGE_KEY) ?? undefined,
      );
      if (stored?.orderNumber) {
        setDisplayNumber(stored.orderNumber);
      }

      try {
        const res = await fetch("/api/liqpay/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: stored
            ? JSON.stringify({
                orderId: stored.orderId,
                orderNumber: stored.orderNumber,
                liqpayOrderId: stored.liqpayOrderId,
              })
            : undefined,
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
      if (!cancelled && !done.current && attempt < 12) {
        window.setTimeout(() => setAttempt((a) => a + 1), 2000);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [attempt, router]);

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
