import { SectionHeading } from "@/components/shop/SectionHeading";
import { getSiteSettings, aboutShortForLocale } from "@/lib/data/settings";
import type { Locale } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";
import Image from "next/image";

export default async function AboutPage({
  params,
}: {
  params: { locale: string };
}) {
  const locale = params.locale as Locale;
  const t = await getTranslations({ locale, namespace: "about" });
  const settings = await getSiteSettings();
  const short = aboutShortForLocale(settings, locale);

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 md:px-10 md:py-28">
      <div className="grid gap-12 md:grid-cols-2 md:items-start">
        <div>
          <SectionHeading title={t("title")} />
          <p className="mt-8 font-display text-xl leading-relaxed text-muted md:text-2xl">
            {short ?? t("body")}
          </p>
          <p className="mt-6 leading-relaxed text-muted">{t("body")}</p>
          <a
            href="https://www.instagram.com/floret_poltava/"
            target="_blank"
            rel="noopener noreferrer"
            className="link-subtle mt-8 inline-block text-sm uppercase tracking-[0.15em]"
          >
            @floret_poltava
          </a>
        </div>
        <div className="relative aspect-[3/4] w-full overflow-hidden rounded-t-[50%] bg-bg">
          <Image
            src="https://images.unsplash.com/photo-1527529482387-4692179f6c43?auto=format&fit=crop&w=1200&q=80"
            alt=""
            fill
            className="object-cover"
            sizes="(max-width:768px) 100vw, 50vw"
          />
        </div>
      </div>
    </div>
  );
}
