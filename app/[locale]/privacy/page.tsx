import type { Metadata } from "next";
import type { Locale } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const locale = params.locale as Locale;
  const t = await getTranslations({ locale, namespace: "privacy" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function PrivacyPage({
  params,
}: {
  params: { locale: string };
}) {
  const t = await getTranslations({
    locale: params.locale as Locale,
    namespace: "privacy",
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20 md:px-10 md:py-28">
      <h1 className="h-section">{t("title")}</h1>
      <div className="text-body-muted mt-12 space-y-12">
        <section>
          <h2 className="h-subsection">{t("introTitle")}</h2>
          <p className="mt-4 whitespace-pre-line">{t("introBody")}</p>
        </section>
        <section>
          <h2 className="h-subsection">{t("collectionTitle")}</h2>
          <p className="mt-4 whitespace-pre-line">{t("collectionBody")}</p>
        </section>
        <section>
          <h2 className="h-subsection">{t("disclosureTitle")}</h2>
          <p className="mt-4 whitespace-pre-line">{t("disclosureBody")}</p>
        </section>
        <section>
          <h2 className="h-subsection">{t("securityTitle")}</h2>
          <p className="mt-4 whitespace-pre-line">{t("securityBody")}</p>
        </section>
        <section>
          <h2 className="h-subsection">{t("companyTitle")}</h2>
          <p className="mt-4 whitespace-pre-line">{t("companyBody")}</p>
        </section>
      </div>
    </div>
  );
}
