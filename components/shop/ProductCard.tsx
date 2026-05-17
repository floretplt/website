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
        <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-ink/[0.08] bg-white">
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
              <div className="flex aspect-[4/5] w-full shrink-0 items-center justify-center bg-bg text-sm text-muted">
                Floret
              </div>
            )}
            <div className="flex min-h-0 flex-1 flex-col px-3.5 pb-3.5 pt-3.5">
              <div className="flex items-baseline justify-between gap-3 text-left">
                <span className="h-card line-clamp-2 min-w-0 transition-colors group-hover:text-rose/90">
                  {name}
                </span>
                <span className="text-ui-muted shrink-0 tabular-nums">
                  {priceFromPrefix ? (
                    <>
                      <span>{priceFromPrefix}</span>{" "}
                    </>
                  ) : null}
                  {formatMoney(listPrice, cur)}
                </span>
              </div>
              {showSizeTiers ? (
                <p className="text-ui-muted mt-1.5 text-left tabular-nums">
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
            className="absolute inset-0 z-10 rounded-xl outline-none ring-ink focus-visible:ring-2"
            aria-label={name}
          />
          {showOrderCta ? (
            <div className="relative z-20 px-3 pb-3 pt-0">
              <Link
                href={orderHref}
                className="btn-catalog mt-3 block w-full shrink-0 text-center"
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
          <div className="flex aspect-square w-full items-center justify-center bg-bg text-sm uppercase tracking-widest text-muted">
            Floret
          </div>
        )}
        <div className="mt-4 flex flex-col items-center text-center">
          <span className="h-card transition-colors group-hover:text-rose">
            {name}
          </span>
          <div className="mt-1 flex flex-wrap justify-center gap-2">
            <span className="text-meta font-medium uppercase tracking-[0.12em]">
              {moodLabel}
            </span>
          </div>
          <p className="text-body-muted mt-2">
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
