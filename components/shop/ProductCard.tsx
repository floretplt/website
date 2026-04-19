import { Link } from "@/i18n/navigation";
import { ProductImageLightbox } from "@/components/shop/ProductImageLightbox";
import type { ProductRow } from "@/lib/types/database";
import type { Locale } from "@/i18n/routing";
import type { Size } from "@/lib/constants";
import { formatMoney } from "@/lib/format";
import {
  primaryImage,
  productCurrency,
  productMinPrice,
  productName,
  productPriceForSize,
  offeredSizes,
} from "@/lib/product-display";
type CardProps = {
  product: ProductRow;
  locale: Locale;
  category: string;
  moodLabel: string;
  /** Kept for API compatibility; catalog styles are illustrative, not stock. */
  sizeLabel?: string;
  availableLabel?: string;
  unavailableLabel?: string;
  orderLabel: string;
  /** Editorial grid: catalog tiles mimic IG feed posts (4:5 + rounded card). */
  variant?: "default" | "catalog";
  /** e.g. «від» / «from» — prepended to the smallest-tier price */
  priceFromPrefix?: string;
  /** With `variant="catalog"`: show «Замовити» inside the card footer (e.g. home featured, catalog grid). */
  showOrderCta?: boolean;
  /** With `variant="catalog"`: compact S / M / L prices under the title row. */
  showSizeTiers?: boolean;
  /** Softer network priority so the hero and first grid slots win (e.g. home featured). */
  deferredImage?: boolean;
};

export function ProductCard({
  product,
  locale,
  category,
  moodLabel,
  orderLabel,
  variant = "default",
  priceFromPrefix,
  showOrderCta = false,
  showSizeTiers = false,
  deferredImage = false,
}: CardProps) {
  const img = primaryImage(product);
  const listPrice = productMinPrice(product, locale);
  const cur = productCurrency(locale);
  const name = productName(product, locale);
  const href = `/catalog/${category}/${product.slug}`;
  const orderHref = `/order?product=${product.slug}&category=${category}`;

  if (variant === "catalog") {
    const tierLetter = (s: Size) =>
      s === "small" ? "S" : s === "medium" ? "M" : "L";
    const tiers = offeredSizes(product, locale);

    return (
      <article className="flex h-full min-h-0 flex-col animate-fadeIn">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-sm ring-1 ring-ink/[0.04]">
          {/* 4:5 — same proportion as typical Instagram feed posts (e.g. 1080×1350) */}
          {img ? (
            <ProductImageLightbox
              images={[img]}
              alt={name}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              aspectClassName="aspect-[4/5] w-full shrink-0"
              quality={68}
              loading={deferredImage ? "lazy" : undefined}
              fetchPriority={deferredImage ? "low" : undefined}
            />
          ) : (
            <div className="flex aspect-[4/5] w-full shrink-0 items-center justify-center bg-bg text-xs uppercase tracking-widest text-muted">
              Floret
            </div>
          )}
          <div className="flex min-h-0 flex-1 flex-col border-t border-ink/10 px-3 pb-3 pt-3">
            <Link href={href} className="group block text-left">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-3">
                <span className="line-clamp-2 min-h-[2.75rem] font-display text-lg leading-snug text-ink group-hover:text-rose">
                  {name}
                </span>
                <span className="shrink-0 pt-0.5 text-sm tabular-nums text-ink">
                  {priceFromPrefix ? (
                    <>
                      <span className="text-muted">{priceFromPrefix}</span>{" "}
                    </>
                  ) : null}
                  {formatMoney(listPrice, cur, locale)}
                </span>
              </div>
            </Link>
            {showSizeTiers ? (
              <p className="mt-2 min-h-[2.25rem] text-left text-[10px] leading-snug text-muted">
                {tiers.map((s, i) => {
                  const pr = productPriceForSize(product, locale, s);
                  if (pr == null) return null;
                  return (
                    <span key={s}>
                      {i > 0 ? " · " : null}
                      {tierLetter(s)}{" "}
                      {formatMoney(pr, cur, locale)}
                    </span>
                  );
                })}
              </p>
            ) : null}
            {showOrderCta ? (
              <Link
                href={orderHref}
                className="btn-square mt-3 block w-full shrink-0 text-center"
              >
                {orderLabel}
              </Link>
            ) : null}
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="group flex flex-col animate-fadeIn">
      {img ? (
        <ProductImageLightbox
          images={[img]}
          alt={name}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          aspectClassName="aspect-square w-full"
          quality={68}
          loading={deferredImage ? "lazy" : undefined}
          fetchPriority={deferredImage ? "low" : undefined}
        />
      ) : (
        <div className="flex aspect-square w-full items-center justify-center bg-bg text-xs uppercase tracking-widest text-muted">
          Floret
        </div>
      )}
      <div className="mt-4 flex flex-col items-center text-center">
        <Link href={href} className="font-display text-lg text-ink hover:text-rose">
          {name}
        </Link>
        <div className="mt-1 flex flex-wrap justify-center gap-2">
          <span className="text-[10px] uppercase tracking-[0.12em] text-muted">
            {moodLabel}
          </span>
        </div>
        <p className="mt-2 text-sm text-muted">
          {priceFromPrefix ? (
            <>
              <span className="text-muted">{priceFromPrefix}</span>{" "}
            </>
          ) : null}
          {formatMoney(listPrice, cur, locale)}
        </p>
        <Link href={orderHref} className="btn-square mt-4 w-full max-w-[200px] text-center">
          {orderLabel}
        </Link>
      </div>
    </article>
  );
}
