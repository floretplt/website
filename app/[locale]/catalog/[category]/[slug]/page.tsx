import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { ProductDetailGallery } from "@/components/shop/ProductDetailGallery";
import { ProductStickyCta } from "@/components/shop/ProductStickyCta";
import { ProductCard } from "@/components/shop/ProductCard";
import { Reveal } from "@/components/animations/Reveal";
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

  const cur = productCurrency();
  const orderHref = `/order?product=${product.slug}&category=${category}`;
  const lowPrice = productMinPrice(product);
  const highPrice = productMaxPrice(product);
  const tiers = offeredSizes(product);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: productName(product),
    description: productDescription(product),
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
      <article className="mx-auto max-w-6xl px-4 pb-[max(7rem,calc(5.5rem+env(safe-area-inset-bottom,0px)))] pt-10 sm:px-6 sm:pt-12 md:px-10 md:pb-16 md:pt-16">
        <p className="eyebrow mb-2">{tc(category)}</p>
        <div className="grid gap-10 md:grid-cols-2 md:gap-12 lg:gap-16">
          <div className="space-y-4">
            {gallery.length > 0 ? (
              <ProductDetailGallery
                images={gallery}
                productName={productName(product)}
              />
            ) : null}
          </div>

          <div className="md:sticky md:top-28 md:self-start">
            <h1 className="font-display text-3xl text-ink sm:text-4xl md:text-5xl">
              {productName(product)}
            </h1>
            <div className="mt-4 space-y-1 text-base text-muted md:text-sm">
              {tiers.map((size) => {
                const amt = productPriceForSize(product, size);
                if (amt == null) return null;
                return (
                  <p key={size}>
                    <span className="font-medium text-ink">
                      {size === "small" ? "S" : size === "medium" ? "M" : "L"}
                    </span>
                    {" — "}
                    {formatMoney(amt, cur)}
                  </p>
                );
              })}
            </div>
            <p className="mt-4 text-base text-muted md:text-sm">
              {t("mood")}: {tm(product.color_mood)}
            </p>
            <p className="mt-4 text-base leading-relaxed text-muted md:text-sm">{t("styleNote")}</p>
            <div className="mt-8 max-w-prose text-base leading-relaxed text-muted md:text-sm">
              {productDescription(product) || "—"}
            </div>
            <Link href={orderHref} className="btn-pill mt-10 hidden md:inline-flex">
              {t("order")}
            </Link>
          </div>
        </div>

        {related.length > 0 ? (
          <section className="mt-20 border-t border-ink/10 pt-16">
            <Reveal>
              <h2 className="h-section mb-10">{t("related")}</h2>
            </Reveal>
            <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((p, i) => (
                <Reveal key={p.id} delayMs={i * 70}>
                  <ProductCard
                    product={p}
                    category={category}
                    moodLabel={tm(p.color_mood)}
                    orderLabel={t("order")}
                    priceFromPrefix={t("from")}
                  />
                </Reveal>
              ))}
            </div>
          </section>
        ) : null}
      </article>

      <ProductStickyCta href={orderHref} label={t("order")} />
    </>
  );
}
