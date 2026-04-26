import { notFound } from "next/navigation";
import { redirect } from "@/i18n/navigation";
import { Suspense } from "react";
import { ProductCard } from "@/components/shop/ProductCard";
import { CatalogFilters } from "@/components/shop/CatalogFilters";
import {
  PRODUCT_CATEGORIES,
  type ProductCategory,
} from "@/lib/constants";
import { getProductsByCategory } from "@/lib/data/products";
import type { ProductRow } from "@/lib/types/database";
import type { Locale } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";
import {
  productMaxPrice,
  productMinPrice,
} from "@/lib/product-display";

function filterProducts(
  products: ProductRow[],
  locale: Locale,
  sp: Record<string, string | string[] | undefined>,
): ProductRow[] {
  const mood = typeof sp.mood === "string" ? sp.mood : undefined;
  const min = sp.min != null ? Number(sp.min) : undefined;
  const max = sp.max != null ? Number(sp.max) : undefined;
  return products.filter((p) => {
    if (mood && p.color_mood !== mood) return false;
    const low = productMinPrice(p, locale);
    const high = productMaxPrice(p, locale);
    if (min != null && !Number.isNaN(min) && high < min) return false;
    if (max != null && !Number.isNaN(max) && low > max) return false;
    return true;
  });
}

export default async function CatalogCategoryPage({
  params,
  searchParams,
}: {
  params: { locale: string; category: string };
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const locale = params.locale as Locale;
  const cat = params.category as ProductCategory;

  if (!PRODUCT_CATEGORIES.includes(cat)) {
    notFound();
  }

  const t = await getTranslations({ locale, namespace: "catalog" });
  const tc = await getTranslations({ locale, namespace: "categories" });
  const tm = await getTranslations({ locale, namespace: "moods" });
  const tp = await getTranslations({ locale, namespace: "product" });

  if (cat === "decor") {
    notFound();
  }

  if (cat === "wedding") {
    redirect({ href: "/wedding", locale });
  }

  const products = await getProductsByCategory(cat);
  const filtered = filterProducts(products, locale, searchParams);

  const lows = products.map((p) => productMinPrice(p, locale));
  const highs = products.map((p) => productMaxPrice(p, locale));
  const minPrice = lows.length ? Math.floor(Math.min(...lows)) : 0;
  const maxPrice = highs.length ? Math.ceil(Math.max(...highs)) : 5000;

  return (
    <div className="bg-bg">
      <div className="mx-auto max-w-7xl border-b border-ink/10 px-4 pb-8 pt-10 sm:px-6 sm:pt-12 md:px-10 md:pb-10 md:pt-16">
        <h1 className="h-section max-w-2xl text-balance">{tc(cat)}</h1>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 md:px-10 md:py-12">
        <p className="mx-auto max-w-3xl text-center text-sm leading-relaxed text-muted md:text-[15px]">
          {t("styleDisclaimer")}
        </p>

        <div className="mt-12 flex flex-col gap-12 lg:flex-row lg:gap-14">
          <div className="lg:w-56 lg:flex-shrink-0">
            <Suspense fallback={<div className="h-40 animate-pulse bg-ink/[0.04]" />}>
              <CatalogFilters minPrice={minPrice} maxPrice={maxPrice} />
            </Suspense>
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[11px] uppercase tracking-[0.15em] text-muted">
              {t("showing", {
                from: filtered.length ? 1 : 0,
                to: filtered.length,
                total: filtered.length,
              })}
            </p>
            {filtered.length === 0 ? (
              <p className="mt-8 text-muted">{t("empty")}</p>
            ) : (
              <div className="mt-8 grid grid-cols-1 gap-10 sm:grid-cols-2 xl:grid-cols-3">
                {filtered.map((p) => (
                  <div key={p.id} className="h-full min-h-0">
                    <ProductCard
                      product={p}
                      locale={locale}
                      category={cat}
                      moodLabel={tm(p.color_mood)}
                      orderLabel={tp("order")}
                      variant="catalog"
                      priceFromPrefix={tp("from")}
                      showOrderCta
                      showSizeTiers
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
