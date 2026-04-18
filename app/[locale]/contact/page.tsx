import { getSiteSettings } from "@/lib/data/settings";
import type { Locale } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";
import { formatWorkingHours } from "@/lib/format";
import { normalizeUaPhone } from "@/lib/phone";

export default async function ContactPage({
  params,
}: {
  params: { locale: string };
}) {
  const locale = params.locale as Locale;
  const t = await getTranslations({ locale, namespace: "contact" });
  const settings = await getSiteSettings();
  const address =
    locale === "uk" ? settings.pickup_address_uk : settings.pickup_address_en;
  const hours = formatWorkingHours(settings.working_hours, locale);

  return (
    <div className="mx-auto max-w-6xl px-6 py-20 md:px-10 md:py-28">
      <h1 className="h-section">{t("title")}</h1>
      <div className="mt-12 grid gap-12 md:grid-cols-2">
        <div className="space-y-8 text-sm leading-relaxed text-muted">
          <div>
            <p className="eyebrow mb-2">{t("phone")}</p>
            <a href={`tel:${normalizeUaPhone(settings.phone)}`} className="text-ink hover:text-rose">
              {settings.phone}
            </a>
          </div>
          <div>
            <p className="eyebrow mb-2">{t("address")}</p>
            <p>{address}</p>
          </div>
          <div>
            <p className="eyebrow mb-2">{t("hours")}</p>
            <p className="whitespace-pre-wrap">{hours}</p>
          </div>
          <div>
            <p className="eyebrow mb-2">Instagram</p>
            <a
              href="https://www.instagram.com/floret_poltava/"
              target="_blank"
              rel="noopener noreferrer"
              className="link-subtle"
            >
              @floret_poltava
            </a>
          </div>
        </div>
        <div className="relative min-h-[320px] w-full border border-ink/10 bg-bg">
          <iframe
            title="Map"
            className="absolute inset-0 h-full w-full"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d82344.7!2d34.53!3d49.59!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x40d825e5c4b8b8b9%3A0x1!2z0J_QvtC70Y_QutCwLCDQn9C10YDQvtCx0LvQtdC90LjRjyDQo9C60YDQsNC40LzQsA!5e0!3m2!1suk!2sua!4v1"
          />
        </div>
      </div>
    </div>
  );
}
