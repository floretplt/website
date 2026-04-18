import type { Metadata } from "next";
import { WeddingInquirySection } from "@/components/shop/WeddingInquirySection";
import type { Locale } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";

const WEDDING_IMAGE = "/images/categories/wedding.png";

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const locale = params.locale as Locale;
  const t = await getTranslations({ locale, namespace: "wedding" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function WeddingPage({
  params,
}: {
  params: { locale: string };
}) {
  const t = await getTranslations({
    locale: params.locale as Locale,
    namespace: "wedding",
  });

  return (
    <WeddingInquirySection imageSrc={WEDDING_IMAGE} imageAlt={t("imageAlt")} />
  );
}
