import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

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

  return (
    <div className="mx-auto max-w-lg px-6 py-24 text-center">
      <h1 className="h-section">{ok ? t("successPaid") : te("paymentFailed")}</h1>
      <Link href="/catalog/bouquets" className="btn-pill mt-10 inline-flex">
        {locale === "uk" ? "До каталогу" : "Back to catalog"}
      </Link>
    </div>
  );
}
