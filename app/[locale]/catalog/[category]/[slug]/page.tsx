import { notFound } from "next/navigation";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { ProductStickyCta } from "@/components/shop/ProductStickyCta";
import { ProductCard } from "@/components/shop/ProductCard";
import {
  PRODUCT_CATEGORIES,
  type ProductCategory,
} from "@/lib/constants";
import {
  getProductBySlug,
  getRelatedProducts,
} from "@/lib/data/products";
import type { Locale } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";
import {
  galleryUrls,
  productDescription,
  productName,
  productCurrency,
  productMaxPrice,
  productMinPrice,
  productPriceForSize,
  offeredSizes,
} from "@/lib/product-display";
import { formatMoney } from "@/lib/format";

export default async function ProductPage({
  params,
}: {
  params: { locale: string; category: string; slug: string };
}) {
  const locale = params.locale as Locale;
  const category = params.category as ProductCategory;

  if (!PRODUCT_CATEGORIES.includes(category)) {
    notFound();
  }

  if (category === "wedding") {
    notFound();
  }

  const product = await getProductBySlug(category, params.slug);
  if (!product) {
    notFound();
  }

  const t = await getTranslations({ locale, namespace: "product" });
  const tm = await getTranslations({ locale, namespace: "moods" });
  const tc = await getTranslations({ locale, namespace: "categories" });

  const related = await getRelatedProducts(category, product.id, 4);
  const gallery = galleryUrls(product);

  const cur = productCurrency(locale);
  const orderHref = `/order?product=${product.slug}&category=${category}`;
  const lowPrice = productMinPrice(product, locale);
  const highPrice = productMaxPrice(product, locale);
  const tiers = offeredSizes(product, locale);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: productName(product, locale),
    description: productDescription(product, locale),
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: cur,
      lowPrice: String(lowPrice),
      highPrice: String(highPrice),
      availability: "https://schema.org/InStock",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <article className="mx-auto max-w-6xl px-6 pb-28 pt-12 md:px-10 md:pb-16 md:pt-16">
        <p className="eyebrow mb-2">{tc(category)}</p>
        <div className="grid gap-10 md:grid-cols-2 md:gap-12 lg:gap-16">
          <div className="space-y-4">
            {/*
              Bounded frame + object-contain: show the whole bouquet without cropping.
              Not full-viewport — max height keeps title/prices visible on most screens.
            */}
            <div className="relative mx-auto w-full max-w-xl md:mx-0">
              <div className="relative h-[min(58vh,560px)] w-full sm:h-[min(52vh,520px)] md:h-[min(62vh,640px)]">
                {gallery[0] ? (
                  <Image
                    src={gallery[0]}
                    alt={productName(product, locale)}
                    fill
                    className="object-contain object-center"
                    priority
                    sizes="(max-width:768px) 100vw, 45vw"
                  />
                ) : null}
              </div>
            </div>
            {gallery.length > 1 ? (
              <div className="grid grid-cols-4 gap-2">
                {gallery.slice(1, 5).map((src, i) => (
                  <div key={src + i} className="relative aspect-square overflow-hidden bg-bg">
                    <Image src={src} alt="" fill className="object-cover" sizes="120px" />
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <div className="md:sticky md:top-28 md:self-start">
            <h1 className="font-display text-4xl text-ink md:text-5xl">
              {productName(product, locale)}
            </h1>
            <div className="mt-4 space-y-1 text-sm text-muted">
              {tiers.map((size) => {
                const amt = productPriceForSize(product, locale, size);
                if (amt == null) return null;
                return (
                  <p key={size}>
                    <span className="font-medium text-ink">
                      {size === "small" ? "S" : size === "medium" ? "M" : "L"}
                    </span>
                    {" — "}
                    {formatMoney(amt, cur, locale)}
                  </p>
                );
              })}
            </div>
            <p className="mt-4 text-sm text-muted">
              {t("mood")}: {tm(product.color_mood)}
            </p>
            <p className="mt-4 text-sm leading-relaxed text-muted">{t("styleNote")}</p>
            <div className="mt-8 max-w-prose leading-relaxed text-muted">
              {productDescription(product, locale) || "—"}
            </div>
            <Link href={orderHref} className="btn-pill mt-10 hidden md:inline-flex">
              {t("order")}
            </Link>
          </div>
        </div>

        {related.length > 0 ? (
          <section className="mt-20 border-t border-ink/10 pt-16">
            <h2 className="h-section mb-10">{t("related")}</h2>
            <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  locale={locale}
                  category={category}
                  moodLabel={tm(p.color_mood)}
                  orderLabel={t("order")}
                  priceFromPrefix={t("from")}
                />
              ))}
            </div>
          </section>
        ) : null}
      </article>

      <ProductStickyCta href={orderHref} label={t("order")} />
    </>
  );
}
