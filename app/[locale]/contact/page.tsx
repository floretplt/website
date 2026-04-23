import { getSiteSettings } from "@/lib/data/settings";
import type { Locale } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";
import { formatWorkingHours } from "@/lib/format";
import { googleMapsEmbedSrc } from "@/lib/maps-embed";
import { voiceDialHref } from "@/lib/phone";

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
  const mapSrc = googleMapsEmbedSrc(address, locale);

  return (
    <div className="mx-auto max-w-6xl px-6 py-20 md:px-10 md:py-28">
      <h1 className="h-section">{t("title")}</h1>
      <div className="mt-12 grid gap-12 md:grid-cols-2">
        <div className="space-y-8 text-sm leading-relaxed text-muted">
          <div>
            <p className="eyebrow mb-2">{t("phone")}</p>
            <a href={voiceDialHref(settings.phone)} className="text-ink hover:text-rose">
              {settings.phone}
            </a>
          </div>
          {settings.email?.trim() ? (
            <div>
              <p className="eyebrow mb-2">{t("email")}</p>
              <a href={`mailto:${settings.email.trim()}`} className="text-ink hover:text-rose">
                {settings.email.trim()}
              </a>
            </div>
          ) : null}
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
            src={mapSrc}
          />
        </div>
      </div>
    </div>
  );
}
