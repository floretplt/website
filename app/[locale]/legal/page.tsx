import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const locale = params.locale as Locale;
  const t = await getTranslations({ locale, namespace: "legal" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function LegalPage({
  params,
}: {
  params: { locale: string };
}) {
  const locale = params.locale as Locale;
  const t = await getTranslations({ locale, namespace: "legal" });
  const linkClass =
    "text-xs font-medium uppercase tracking-[0.15em] text-muted underline-offset-4 hover:text-ink hover:underline";

  return (
    <div className="mx-auto max-w-3xl px-6 py-20 md:px-10 md:py-28">
      <h1 className="h-section">{t("title")}</h1>
      <nav
        aria-label="On this page"
        className="mt-8 flex flex-wrap gap-x-4 gap-y-2 border-b border-ink/10 pb-6"
      >
        <a href="#payee" className={linkClass}>
          {t("navPayee")}
        </a>
        <a href="#refund" className={linkClass}>
          {t("navRefund")}
        </a>
        <a href="#delivery" className={linkClass}>
          {t("navDelivery")}
        </a>
      </nav>

      <section id="payee" className="scroll-mt-28 pt-12">
        <h2 className="font-display text-2xl text-ink">{t("payeeTitle")}</h2>
        <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-muted md:text-[15px]">
          {t("payeeBody")}
        </p>
      </section>

      <section id="refund" className="scroll-mt-28 border-t border-ink/10 pt-12">
        <h2 className="font-display text-2xl text-ink">{t("refundTitle")}</h2>
        <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-muted md:text-[15px]">
          {t("refundBody")}
        </p>
      </section>

      <section id="delivery" className="scroll-mt-28 border-t border-ink/10 pt-12">
        <h2 className="font-display text-2xl text-ink">{t("navDelivery")}</h2>
        <p className="mt-4 text-sm leading-relaxed text-muted md:text-[15px]">
          {t("deliveryIntro")}{" "}
          <Link href="/delivery" className="text-ink underline underline-offset-2 hover:text-rose">
            {t("deliveryLink")}
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
