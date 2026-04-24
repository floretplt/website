import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

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
  const status =
    typeof searchParams.status === "string" ? searchParams.status : "";

  const ok = status === "success" || status === "sandbox";

  const orderNumRaw = firstString(searchParams.orderNumber);
  const orderNumber =
    orderNumRaw != null && orderNumRaw.trim() !== ""
      ? Number(orderNumRaw)
      : NaN;
  const orderNumberOk = Number.isFinite(orderNumber) && orderNumber > 0;

  return (
    <div className="mx-auto max-w-lg px-6 py-24 text-center">
      {ok && orderNumberOk ? (
        <div className="space-y-6 text-left">
          <h1 className="h-section text-center">{t("thanksPaidTitle")}</h1>
          <p className="text-lg leading-relaxed text-ink">
            {t("thanksPaidLead", { orderNumber: String(orderNumber) })}
          </p>
          <p className="text-sm leading-relaxed text-muted">
            {t("thanksPaidSub")}
          </p>
          <div className="flex flex-col items-center gap-4 pt-4 sm:flex-row sm:justify-center">
            <Link
              href={`/order/${orderNumber}`}
              className="btn-pill inline-flex justify-center"
            >
              {t("thanksPaidCta")}
            </Link>
            <Link
              href="/catalog/bouquets"
              className="text-sm font-medium text-muted underline-offset-4 hover:text-ink hover:underline"
            >
              {locale === "uk" ? "До каталогу" : "Back to catalog"}
            </Link>
          </div>
        </div>
      ) : (
        <>
          <h1 className="h-section">{ok ? t("successPaid") : te("paymentFailed")}</h1>
          <Link href="/catalog/bouquets" className="btn-pill mt-10 inline-flex">
            {locale === "uk" ? "До каталогу" : "Back to catalog"}
          </Link>
        </>
      )}
    </div>
  );
}
