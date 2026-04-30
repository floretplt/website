"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";

type Props = {
  initialOrderNumber?: number;
  /** After reserve checkout: show thank-you before lookup form. */
  initialThanks?: boolean;
};

export function OrderLookup({ initialOrderNumber, initialThanks = false }: Props) {
  const t = useTranslations("orderStatus");
  const tOrder = useTranslations("order");
  const [orderNumber, setOrderNumber] = useState(
    initialOrderNumber ? String(initialOrderNumber) : "",
  );
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const showThanks =
    initialThanks === true && initialOrderNumber != null && !result;

  const lookup = async () => {
    setLoading(true);
    setErr(null);
    setResult(null);
    try {
      const res = await fetch("/api/orders/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_number: Number(orderNumber),
          phone,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setErr(t("notFound"));
        return;
      }
      setResult(json.order as Record<string, unknown>);
    } catch {
      setErr(t("notFound"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-12 sm:px-6 sm:py-16">
      <h1 className="h-section">{t("title")}</h1>

      {showThanks ? (
        <div className="mt-10 space-y-4 rounded-lg border border-ink/15 bg-bg/80 p-6 md:p-8">
          <p className="font-display text-2xl tracking-tight text-ink">
            {tOrder("thanksReserveTitle")}
          </p>
          <p className="text-base leading-relaxed text-ink">
            {tOrder("thanksReserveLead", {
              orderNumber: String(initialOrderNumber),
            })}
          </p>
          <p className="text-base leading-relaxed text-muted md:text-sm">
            {tOrder("thanksReserveSub")}
          </p>
          <Link
            href={`/order/${initialOrderNumber}`}
            className="mt-2 inline-block text-base font-medium text-ink underline-offset-4 hover:underline md:text-sm"
          >
            {tOrder("thanksDismissBanner")}
          </Link>
        </div>
      ) : null}

      {!result ? (
        <div
          className={
            showThanks ? "mt-10 space-y-6 border-t border-ink/10 pt-10" : "mt-10 space-y-6"
          }
        >
          <label className="block text-base text-muted md:text-sm">
            <span className="mb-1 block uppercase tracking-wider">{t("orderNumber")}</span>
            <input
              className="w-full border border-ink/20 bg-transparent px-3 py-2"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
            />
          </label>
          <label className="block text-base text-muted md:text-sm">
            <span className="mb-1 block uppercase tracking-wider">{t("enterPhone")}</span>
            <input
              type="tel"
              className="w-full border border-ink/20 bg-transparent px-3 py-2"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+380..."
            />
          </label>
          {err ? <p className="text-base text-red-800 md:text-sm">{err}</p> : null}
          <button type="button" className="btn-pill" onClick={lookup} disabled={loading}>
            {loading ? "…" : t("lookup")}
          </button>
        </div>
      ) : (
        <div className="mt-10 space-y-4 border border-ink/10 p-6">
          <p>
            <span className="eyebrow">{t("orderNumber")}</span>{" "}
            <span className="font-medium">{String(result.order_number)}</span>
          </p>
          <p>
            <span className="eyebrow">{t("status")}</span>{" "}
            <span className="font-medium">
              {t(`status_${String(result.status)}` as "status_new")}
            </span>
          </p>
          <p className="text-base text-muted md:text-sm">{String(result.product_name)}</p>
        </div>
      )}
    </div>
  );
}
