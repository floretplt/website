import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Logo } from "@/components/layout/Logo";
import { InstagramIcon } from "@/components/icons/Instagram";
import type { SiteSettingsRow } from "@/lib/types/database";
import type { Locale } from "@/i18n/routing";
import { formatWorkingHours } from "@/lib/format";
import { voiceDialHref } from "@/lib/phone";

type Props = {
  settings: SiteSettingsRow;
  locale: Locale;
};

export async function Footer({ settings, locale }: Props) {
  const t = await getTranslations("footer");
  const hours = formatWorkingHours(settings.working_hours, locale);

  const address =
    locale === "uk" ? settings.pickup_address_uk : settings.pickup_address_en;

  return (
    <footer className="border-t border-ink/10 bg-ink text-bg">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-14 sm:px-6 sm:py-16 md:grid-cols-3 md:px-10">
        <div>
          <Logo height={30} />
          <p className="mt-6 text-sm leading-relaxed text-bg/80">
            @floret_poltava
          </p>
          <a
            href="https://www.instagram.com/floret_poltava/"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 text-xs uppercase tracking-[0.15em] text-bg/90 transition-colors hover:text-bg"
          >
            <InstagramIcon className="h-4 w-4" />
            Instagram
          </a>
        </div>
        <div className="text-sm leading-relaxed text-bg/85">
          <p className="eyebrow mb-2 text-bg/60">{locale === "uk" ? "Контакти" : "Contact"}</p>
          <p>
            <a href={voiceDialHref(settings.phone)} className="hover:text-bg">
              {settings.phone}
            </a>
          </p>
          <p className="mt-4">{address}</p>
        </div>
        <div className="text-sm text-bg/85">
          <p className="eyebrow mb-2 text-bg/60">{locale === "uk" ? "Години" : "Hours"}</p>
          <p className="whitespace-pre-wrap">{hours}</p>
          <div className="mt-8 flex flex-col gap-3">
            <Link
              href="/order"
              className="inline-block text-xs font-medium uppercase tracking-[0.15em] text-bg underline-offset-4 hover:underline"
            >
              {locale === "uk" ? "Замовити" : "Order"}
            </Link>
            <Link
              href="/order-status"
              className="inline-block text-xs font-medium uppercase tracking-[0.15em] text-bg/90 underline-offset-4 hover:underline"
            >
              {locale === "uk" ? "Статус замовлення" : "Order status"}
            </Link>
          </div>
        </div>
      </div>
      <div className="border-t border-bg/10 px-4 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom,0px))] text-center text-[11px] uppercase tracking-[0.2em] text-bg/50 sm:px-6">
        <div className="mb-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
          <Link href="/legal" className="text-bg/70 underline-offset-4 hover:text-bg hover:underline">
            {t("legal")}
          </Link>
          <span className="text-bg/30" aria-hidden>
            ·
          </span>
          <Link href="/delivery" className="text-bg/70 underline-offset-4 hover:text-bg hover:underline">
            {t("delivery")}
          </Link>
          <span className="text-bg/30" aria-hidden>
            ·
          </span>
          <Link href="/privacy" className="text-bg/70 underline-offset-4 hover:text-bg hover:underline">
            {t("privacy")}
          </Link>
        </div>
        © {new Date().getFullYear()} Floret Poltava · {t("rights")}
      </div>
    </footer>
  );
}
