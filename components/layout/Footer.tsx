import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Logo } from "@/components/layout/Logo";
import { InstagramIcon } from "@/components/icons/Instagram";
import type { SiteSettingsRow } from "@/lib/types/database";
import { formatWorkingHours } from "@/lib/format";
import { voiceDialHref } from "@/lib/phone";

type Props = {
  settings: SiteSettingsRow;
};

export async function Footer({ settings }: Props) {
  const t = await getTranslations("footer");
  const hours = formatWorkingHours(settings.working_hours);

  const address = settings.pickup_address_uk;

  return (
    <footer className="border-t border-ink/10 bg-ink text-bg">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-14 sm:px-6 sm:py-16 md:grid-cols-3 md:px-10">
        <div>
          <Logo height={30} variant="light" />
          <p className="mt-6 text-base leading-relaxed text-bg/80">
            @floret_poltava
          </p>
          <a
            href="https://www.instagram.com/floret_poltava/"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 text-base uppercase tracking-[0.12em] text-bg/90 transition-colors hover:text-bg md:text-sm md:tracking-[0.15em]"
          >
            <InstagramIcon className="h-4 w-4" />
            Instagram
          </a>
        </div>
        <div className="text-base leading-relaxed text-bg/85">
          <p className="eyebrow mb-2 text-bg/60">Контакти</p>
          <p>
            <a href={voiceDialHref(settings.phone)} className="hover:text-bg">
              {settings.phone}
            </a>
          </p>
          <p className="mt-4">{address}</p>
        </div>
        <div className="text-base text-bg/85">
          <p className="eyebrow mb-2 text-bg/60">Години</p>
          <p className="whitespace-pre-wrap">{hours}</p>
          <div className="mt-8 flex flex-col gap-3">
            <Link
              href="/order"
              className="inline-block text-base font-medium uppercase tracking-[0.12em] text-bg underline-offset-4 hover:underline md:text-sm md:tracking-[0.15em]"
            >
              Замовити
            </Link>
            <Link
              href="/order-status"
              className="inline-block text-base font-medium uppercase tracking-[0.12em] text-bg/90 underline-offset-4 hover:underline md:text-sm md:tracking-[0.15em]"
            >
              Статус замовлення
            </Link>
          </div>
        </div>
      </div>
      <div className="border-t border-bg/10 px-4 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom,0px))] text-center text-[13px] uppercase tracking-[0.14em] text-bg/50 sm:px-6 md:text-xs md:tracking-[0.2em]">
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
