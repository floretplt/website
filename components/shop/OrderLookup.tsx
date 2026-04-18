"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

type Props = {
  locale: import("@/i18n/routing").Locale;
  initialOrderNumber?: number;
};

export function OrderLookup({ initialOrderNumber }: Props) {
  const t = useTranslations("orderStatus");
  const [orderNumber, setOrderNumber] = useState(
    initialOrderNumber ? String(initialOrderNumber) : "",
  );
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [err, setErr] = useState<string | null>(null);

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
    <div className="mx-auto max-w-lg px-6 py-16">
      <h1 className="h-section">{t("title")}</h1>
      {!result ? (
        <div className="mt-10 space-y-6">
          <label className="block text-sm text-muted">
            <span className="mb-1 block uppercase tracking-wider">{t("orderNumber")}</span>
            <input
              className="w-full border border-ink/20 bg-transparent px-3 py-2"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
            />
          </label>
          <label className="block text-sm text-muted">
            <span className="mb-1 block uppercase tracking-wider">{t("enterPhone")}</span>
            <input
              type="tel"
              className="w-full border border-ink/20 bg-transparent px-3 py-2"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+380..."
            />
          </label>
          {err ? <p className="text-sm text-red-800">{err}</p> : null}
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
          <p className="text-sm text-muted">{String(result.product_name)}</p>
        </div>
      )}
    </div>
  );
}
