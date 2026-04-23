import { HomeFeatured } from "@/components/shop/HomeFeatured";
import { StyleGallery } from "@/components/shop/StyleGallery";
import { CategoryTile } from "@/components/shop/CategoryTile";
import { SectionHeading } from "@/components/shop/SectionHeading";
import { getFeaturedProducts } from "@/lib/data/products";
import { STYLE_GALLERY_ITEMS } from "@/lib/style-gallery";
import { TEAM_MEMBERS } from "@/lib/team";
import { StudioTeamSection } from "@/components/shop/StudioTeamSection";
import {
  aboutShortForLocale,
  getSiteSettings,
} from "@/lib/data/settings";
import type { Locale } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { EditorialDecorSection } from "@/components/shop/EditorialDecorSection";

const HERO_FALLBACK = "/images/hero.jpg";
const CAT_IMG = {
  bouquets: "/images/categories/bouquets.jpg",
  box: "/images/categories/box-bouquets.png",
  wedding: "/images/categories/wedding.png",
};

/** Декор закладів / івентів — editorial block beside the text */
const EDITORIAL_IMAGE = "/images/flowers.png";

export default async function HomePage({
  params,
}: {
  params: { locale: string };
}) {
  const locale = params.locale as Locale;
  const t = await getTranslations({ locale, namespace: "home" });
  const tc = await getTranslations({ locale, namespace: "categories" });
  const tm = await getTranslations({ locale, namespace: "moods" });
  const tp = await getTranslations({ locale, namespace: "product" });

  const [settings, featured] = await Promise.all([
    getSiteSettings(),
    getFeaturedProducts(),
  ]);
  const about = aboutShortForLocale(settings, locale);

  const moodKeys = ["pink", "blue", "yellow", "red", "white", "bright"] as const;
  const moods = Object.fromEntries(moodKeys.map((k) => [k, tm(k)]));

  const heroSrc = settings.hero_image_url || HERO_FALLBACK;

  return (
    <>
      <section className="relative min-h-[85vh] md:min-h-[90vh]">
        <Image
          src={heroSrc}
          alt=""
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-ink/20" />
        <div className="relative z-10 mx-auto flex min-h-[85vh] max-w-6xl flex-col justify-end px-6 pb-20 pt-32 md:min-h-[90vh] md:px-10 md:pb-28">
          <h1 className="h-display max-w-xl text-balance text-white">
            {t("heroTagline")}
          </h1>
          <Link
            href={locale === "en" ? "/en#style-bouquets" : "/#style-bouquets"}
            className="btn-pill-inverse mt-8 w-fit"
          >
            {t("heroCta")}
          </Link>
        </div>
      </section>

      <HomeFeatured
        products={featured}
        locale={locale}
        title={t("featuredTitle")}
        subtitle={t("featuredSubtitle")}
        cta={t("featuredCta")}
        labels={{
          tabAll: t("featuredTabAll"),
          catBouquets: tc("bouquets"),
          catBox: tc("box-bouquets"),
          order: tp("order"),
          priceFrom: tp("from"),
          moods,
        }}
      />

      <section className="border-t border-ink/10 bg-bg py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-6 md:px-10">
          <SectionHeading title={t("categoriesTitle")} />
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <CategoryTile
              title={tc("bouquets")}
              href="/catalog/bouquets"
              imageSrc={CAT_IMG.bouquets}
            />
            <CategoryTile
              title={tc("box-bouquets")}
              href="/catalog/box-bouquets"
              imageSrc={CAT_IMG.box}
            />
            <CategoryTile
              title={tc("wedding")}
              href="/wedding"
              imageSrc={CAT_IMG.wedding}
            />
          </div>
        </div>
      </section>

      <EditorialDecorSection
        imageSrc={EDITORIAL_IMAGE}
        imageAlt={t("editorialTitle")}
      />

      <StudioTeamSection
        sectionTitle={t("studioTeamTitle")}
        aboutText={about ?? t("aboutBody")}
        teamTitle={t("teamTitle")}
        placeholderLabel={t("teamPhotoPlaceholder")}
        names={{
          tanya: t("teamTanya"),
          zhenya: t("teamZhenya"),
          yana: t("teamYana"),
        }}
        bios={{
          tanya: t("teamBioTanya"),
          zhenya: t("teamBioZhenya"),
          yana: t("teamBioYana"),
        }}
        members={TEAM_MEMBERS}
      />

      <StyleGallery
        items={STYLE_GALLERY_ITEMS}
        title={t("galleryTitle")}
        cta={t("galleryCta")}
      />

      <section className="bg-sage/40 py-20 md:py-28">
        <div className="mx-auto max-w-3xl px-6 text-center md:px-10">
          <p className="font-display text-2xl leading-snug text-ink md:text-3xl">
            {t("ctaStrip")}
          </p>
          <Link href="/order" className="btn-pill mt-10 inline-flex">
            {t("ctaButton")}
          </Link>
        </div>
      </section>
    </>
  );
}
