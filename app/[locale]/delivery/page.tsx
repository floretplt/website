import type { Metadata } from "next";
import type { Locale } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const locale = params.locale as Locale;
  const t = await getTranslations({ locale, namespace: "delivery" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function DeliveryPage({
  params,
}: {
  params: { locale: string };
}) {
  const t = await getTranslations({
    locale: params.locale as Locale,
    namespace: "delivery",
  });

  return (
    <div className="mx-auto max-w-3xl px-6 py-20 md:px-10 md:py-28">
      <h1 className="h-section">{t("title")}</h1>
      <div className="mt-10 space-y-10 text-sm leading-relaxed text-muted md:text-[15px]">
        <p>{t("free")}</p>
        <div>
          <p className="font-medium text-ink">{t("cityIntro")}</p>
          <ul className="mt-3 list-inside list-disc space-y-1">
            <li>{t("cityRow1")}</li>
            <li>{t("cityRow2")}</li>
            <li>{t("cityRow3")}</li>
          </ul>
        </div>
        <div>
          <p className="font-medium text-ink">{t("outsideTitle")}</p>
          <ul className="mt-3 list-inside list-disc space-y-1">
            <li>{t("outsideRow1")}</li>
            <li>{t("outsideRow2")}</li>
            <li>{t("outsideRow3")}</li>
          </ul>
        </div>
        <div>
          <p className="font-medium text-ink">{t("notesTitle")}</p>
          <ul className="mt-3 list-inside list-disc space-y-2">
            <li>{t("note1")}</li>
            <li>{t("note2")}</li>
            <li>{t("note3")}</li>
            <li>{t("note4")}</li>
            <li>{t("note5")}</li>
            <li>{t("note6")}</li>
            <li>{t("note7")}</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
