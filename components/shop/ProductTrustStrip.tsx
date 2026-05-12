type Props = {
  freshLabel: string;
  deliveryLabel: string;
  paymentLabel: string;
};

/**
 * Product detail trust row.
 * Mobile: three equal columns (icon + short line) — avoids a tall single column.
 * Reading order: freshness → logistics → payment (typical “why buy here” flow).
 */
export function ProductTrustStrip({
  freshLabel,
  deliveryLabel,
  paymentLabel,
}: Props) {
  return (
    <div className="mt-12 w-full border-t border-ink/10 pt-8 md:mt-20 md:pt-14">
      <ul className="mx-auto grid max-w-5xl grid-cols-3 items-start gap-x-2 gap-y-3 px-0.5 text-center text-base leading-relaxed text-muted sm:gap-x-8 sm:gap-y-4 sm:px-0 md:gap-x-10">
        <li className="flex min-w-0 flex-col items-center gap-1 sm:gap-2">
          <span className="text-lg leading-none sm:text-xl" aria-hidden>
            🌸
          </span>
          <span className="max-w-[10.5rem] sm:max-w-none">{freshLabel}</span>
        </li>
        <li className="flex min-w-0 flex-col items-center gap-1 sm:gap-2">
          <span className="text-lg leading-none sm:text-xl" aria-hidden>
            🚚
          </span>
          <span className="max-w-[10.5rem] sm:max-w-none">{deliveryLabel}</span>
        </li>
        <li className="flex min-w-0 flex-col items-center gap-1 sm:gap-2">
          <span className="text-lg leading-none sm:text-xl" aria-hidden>
            🔒
          </span>
          <span className="max-w-[10.5rem] sm:max-w-none">{paymentLabel}</span>
        </li>
      </ul>
    </div>
  );
}
