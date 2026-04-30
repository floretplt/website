import { Link } from "@/i18n/navigation";
import { ProductImageLightbox } from "@/components/shop/ProductImageLightbox";
import type { ProductRow } from "@/lib/types/database";
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
  const listPrice = productMinPrice(product);
  const cur = productCurrency();
  const name = productName(product);
  const href = `/catalog/${category}/${product.slug}`;
  const orderHref = `/order?product=${product.slug}&category=${category}`;

  if (variant === "catalog") {
    const tierLetter = (s: Size) =>
      s === "small" ? "S" : s === "medium" ? "M" : "L";
    const tiers = offeredSizes(product);

    return (
      <article className="group relative flex h-full min-h-0 flex-col">
        <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-sm ring-1 ring-ink/[0.04]">
          <div className="pointer-events-none relative z-0 flex min-h-0 flex-1 flex-col">
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
                enableLightbox={false}
                imgClassName="transition-transform duration-700 ease-out group-hover:scale-[1.02]"
              />
            ) : (
              <div className="flex aspect-[4/5] w-full shrink-0 items-center justify-center bg-bg text-sm uppercase tracking-widest text-muted md:text-xs">
                Floret
              </div>
            )}
            <div className="flex min-h-0 flex-1 flex-col border-t border-ink/10 px-3 pb-3 pt-3">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-3 text-left">
                <span className="line-clamp-2 min-h-[2.75rem] font-display text-xl leading-snug text-ink transition-colors group-hover:text-rose md:text-lg">
                  {name}
                </span>
                <span className="shrink-0 pt-0.5 text-base tabular-nums text-ink md:text-sm">
                  {priceFromPrefix ? (
                    <>
                      <span className="text-muted">{priceFromPrefix}</span>{" "}
                    </>
                  ) : null}
                  {formatMoney(listPrice, cur)}
                </span>
              </div>
              {showSizeTiers ? (
                <p className="mt-2 min-h-[2.5rem] text-left text-sm leading-snug text-muted tabular-nums md:min-h-[2.25rem] md:text-[11px]">
                  {tiers.map((s, i) => {
                    const pr = productPriceForSize(product, s);
                    if (pr == null) return null;
                    return (
                      <span key={s}>
                        {i > 0 ? " · " : null}
                        {tierLetter(s)}{" "}
                        {formatMoney(pr, cur)}
                      </span>
                    );
                  })}
                </p>
              ) : null}
            </div>
          </div>
          <Link
            href={href}
            className="absolute inset-0 z-10 rounded-2xl outline-none ring-ink focus-visible:ring-2"
            aria-label={name}
          />
          {showOrderCta ? (
            <div className="relative z-20 px-3 pb-3 pt-0">
              <Link
                href={orderHref}
                className="btn-square mt-3 block w-full shrink-0 rounded-lg text-center"
              >
                {orderLabel}
              </Link>
            </div>
          ) : null}
        </div>
      </article>
    );
  }

  return (
    <article className="group relative flex flex-col">
      <div className="pointer-events-none relative z-0 flex flex-col">
        {img ? (
          <ProductImageLightbox
            images={[img]}
            alt={name}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            aspectClassName="aspect-square w-full"
            quality={68}
            loading={deferredImage ? "lazy" : undefined}
            fetchPriority={deferredImage ? "low" : undefined}
            enableLightbox={false}
            imgClassName="transition-transform duration-700 ease-out group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex aspect-square w-full items-center justify-center bg-bg text-sm uppercase tracking-widest text-muted md:text-xs">
            Floret
          </div>
        )}
        <div className="mt-4 flex flex-col items-center text-center">
          <span className="font-display text-xl text-ink transition-colors group-hover:text-rose md:text-lg">
            {name}
          </span>
          <div className="mt-1 flex flex-wrap justify-center gap-2">
            <span className="text-sm uppercase tracking-[0.12em] text-muted md:text-xs">
              {moodLabel}
            </span>
          </div>
          <p className="mt-2 text-base text-muted md:text-sm">
            {priceFromPrefix ? (
              <>
                <span className="text-muted">{priceFromPrefix}</span>{" "}
              </>
            ) : null}
            {formatMoney(listPrice, cur)}
          </p>
        </div>
      </div>
      <Link
        href={href}
        className="absolute inset-0 z-10 outline-none ring-ink focus-visible:ring-2"
        aria-label={name}
      />
      <Link
        href={orderHref}
        className="btn-square relative z-20 mt-4 w-full max-w-[200px] self-center text-center"
      >
        {orderLabel}
      </Link>
    </article>
  );
}
