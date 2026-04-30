import { notFound } from "next/navigation";
import { redirect } from "@/i18n/navigation";
import { Suspense } from "react";
import { ProductCard } from "@/components/shop/ProductCard";
import { Reveal } from "@/components/animations/Reveal";
import { CatalogFilters } from "@/components/shop/CatalogFilters";
import { CatalogHero } from "@/components/shop/CatalogHero";
import { CatalogSort } from "@/components/shop/CatalogSort";
import {
  PRODUCT_CATEGORIES,
  type ProductCategory,
} from "@/lib/constants";
import { getProductsByCategory } from "@/lib/data/products";
import type { ProductRow } from "@/lib/types/database";
import type { Locale } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";
import {
  productCurrency,
  productMaxPrice,
  productMinPrice,
} from "@/lib/product-display";
import { sortCatalogProducts } from "@/lib/catalog-sort";

function filterProducts(
  products: ProductRow[],
  sp: Record<string, string | string[] | undefined>,
): ProductRow[] {
  const mood = typeof sp.mood === "string" ? sp.mood : undefined;
  const min = sp.min != null ? Number(sp.min) : undefined;
  const max = sp.max != null ? Number(sp.max) : undefined;
  return products.filter((p) => {
    if (mood && p.color_mood !== mood) return false;
    const low = productMinPrice(p);
    const high = productMaxPrice(p);
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
  const filtered = filterProducts(products, searchParams);
  const sortKey =
    typeof searchParams.sort === "string" ? searchParams.sort : undefined;
  const displayProducts = sortCatalogProducts(filtered, sortKey);

  const lows = products.map((p) => productMinPrice(p));
  const highs = products.map((p) => productMaxPrice(p));
  const minPrice = lows.length ? Math.floor(Math.min(...lows)) : 0;
  const maxPrice = highs.length ? Math.ceil(Math.max(...highs)) : 5000;

  const cur = productCurrency();
  const priceSuffix = cur === "UAH" ? "грн" : "€";

  const showingTotal =
    filtered.length === products.length ? products.length : filtered.length;

  return (
    <div className="bg-bg">
      <CatalogHero title={tc(cat)} description={t("styleDisclaimer")} />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10 md:px-10 md:py-12">
        <div className="flex flex-col gap-12 lg:flex-row lg:items-start lg:gap-12 xl:gap-16">
          <div className="lg:w-64 lg:flex-shrink-0 xl:w-72">
            <Suspense fallback={<div className="h-48 animate-pulse rounded-2xl bg-ink/[0.04]" />}>
              <CatalogFilters
                minPrice={minPrice}
                maxPrice={maxPrice}
                priceSuffix={priceSuffix}
              />
            </Suspense>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm uppercase tracking-[0.1em] text-muted md:text-[11px] md:tracking-[0.15em]">
                {t("showing", {
                  from: displayProducts.length ? 1 : 0,
                  to: displayProducts.length,
                  total: showingTotal,
                })}
              </p>
              <Suspense fallback={null}>
                <CatalogSort />
              </Suspense>
            </div>
            {displayProducts.length === 0 ? (
              <p className="mt-10 text-muted">{t("empty")}</p>
            ) : (
              <div className="mt-8 grid grid-cols-1 gap-10 sm:grid-cols-2 xl:grid-cols-3">
                {displayProducts.map((p, i) => (
                  <Reveal key={p.id} delayMs={(i % 6) * 60} className="h-full min-h-0">
                    <ProductCard
                      product={p}
                      category={cat}
                      moodLabel={tm(p.color_mood)}
                      orderLabel={tp("order")}
                      variant="catalog"
                      priceFromPrefix={tp("from")}
                      showOrderCta
                      showSizeTiers
                    />
                  </Reveal>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
