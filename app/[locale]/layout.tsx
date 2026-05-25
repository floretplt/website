import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { LocaleHtml } from "@/components/layout/LocaleHtml";
import { routing } from "@/i18n/routing";
import { getSiteSettings } from "@/lib/data/settings";
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
  if (!routing.locales.includes(locale as Locale)) {
    return { title: "Floret" };
  }
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const title = "Floret Poltava — квіткова студія в Полтаві";
  const desc =
    "Квіткова студія Floret у Полтаві — авторські букети, оформлення весіль і подій, доставка по Полтаві та самовивіз. Працюємо з 2015 року.";
  return {
    title: { default: title, template: `%s · Floret Poltava` },
    description: desc,
    alternates: {
      canonical: `${base}/`,
      languages: {
        uk: `${base}/uk`,
        ru: `${base}/ru`,
      },
    },
    openGraph: {
      type: "website",
      siteName: "Floret Poltava",
      locale: locale === "ru" ? "ru_UA" : "uk_UA",
      url: `${base}/${locale}`,
      title,
      description: desc,
      images: [
        {
          url: "/images/hero.jpg",
          width: 1024,
          height: 683,
          alt: "Авторський букет Floret",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: desc,
      images: ["/images/hero.jpg"],
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

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Florist",
    name: "Floret Poltava",
    url: siteUrl,
    logo: `${siteUrl}/icon1.png`,
    image: `${siteUrl}/images/hero.jpg`,
    telephone: normalizeUaPhone(settings.phone),
    address: {
      "@type": "PostalAddress",
      streetAddress: settings.pickup_address_uk,
      addressLocality: "Полтава",
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
        <Header />
        <main>{children}</main>
        <Footer settings={settings} />
      </LocaleHtml>
    </NextIntlClientProvider>
  );
}
