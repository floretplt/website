import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { LocaleHtml } from "@/components/layout/LocaleHtml";
import { routing } from "@/i18n/routing";
import {
  announcementForLocale,
  getSiteSettings,
} from "@/lib/data/settings";
import { normalizeUaPhone } from "@/lib/phone";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}) {
  const { locale } = params;
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const title = locale === "uk" ? "Floret Poltava" : "Floret Poltava";
  const desc =
    locale === "uk"
      ? "Квіткова студія Floret у Полтаві — букети, декор, весільні композиції."
      : "Floret flower studio in Poltava — bouquets, decor, wedding florals.";
  return {
    title: { default: title, template: `%s · Floret` },
    description: desc,
    alternates: {
      canonical: `${base}/${locale === "uk" ? "" : "en"}`,
      languages: {
        uk: `${base}/`,
        en: `${base}/en`,
      },
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const { locale } = params;
  if (!routing.locales.includes(locale as Locale)) {
    notFound();
  }
  setRequestLocale(locale);
  const messages = await getMessages();
  const settings = await getSiteSettings();
  const ann = announcementForLocale(settings, locale as Locale);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Florist",
    name: "Floret Poltava",
    url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
    telephone: normalizeUaPhone(settings.phone),
    address: {
      "@type": "PostalAddress",
      addressLocality:
        locale === "uk" ? "Полтава" : "Poltava",
      addressCountry: "UA",
    },
  };

  return (
    <NextIntlClientProvider messages={messages}>
      <LocaleHtml>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <AnnouncementBar message={ann} />
        <Header />
        <main>{children}</main>
        <Footer settings={settings} locale={locale as Locale} />
      </LocaleHtml>
    </NextIntlClientProvider>
  );
}
