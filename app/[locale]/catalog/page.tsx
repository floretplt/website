import { Suspense } from "react";
import { ProductCard } from "@/components/shop/ProductCard";
import { CatalogFilters } from "@/components/shop/CatalogFilters";
import { getBrowseCatalogProducts } from "@/lib/data/products";
import type { ProductRow } from "@/lib/types/database";
import type { Locale } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";
import { productMaxPrice, productMinPrice } from "@/lib/product-display";
import Image from "next/image";

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

export default async function CatalogAllPage({
  params,
  searchParams,
}: {
  params: { locale: string };
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const locale = params.locale as Locale;

  const t = await getTranslations({ locale, namespace: "catalog" });
  const tm = await getTranslations({ locale, namespace: "moods" });
  const tp = await getTranslations({ locale, namespace: "product" });

  const products = await getBrowseCatalogProducts();
  const filtered = filterProducts(products, locale, searchParams);

  const lows = products.map((p) => productMinPrice(p, locale));
  const highs = products.map((p) => productMaxPrice(p, locale));
  const minPrice = lows.length ? Math.floor(Math.min(...lows)) : 0;
  const maxPrice = highs.length ? Math.ceil(Math.max(...highs)) : 5000;

  return (
    <div className="bg-bg">
      <div className="relative h-40 overflow-hidden md:h-48">
        <Image
          src="https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=2000&q=80"
          alt=""
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-ink/50 to-ink/25" />
        <div className="relative z-10 mx-auto flex h-full max-w-7xl items-end px-6 pb-8 md:px-10">
          <h1 className="h-section max-w-xl text-balance text-white">
            {t("allCategoriesTitle")}
          </h1>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-10 md:px-10 md:py-12">
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
                      category={p.category}
                      moodLabel={tm(p.color_mood)}
                      orderLabel={tp("order")}
                      variant="catalog"
                      priceFromPrefix={tp("from")}
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
