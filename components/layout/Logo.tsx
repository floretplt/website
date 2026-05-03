import { FloretLogoSvg } from "@/components/layout/FloretLogoSvg";

type Props = {
  className?: string;
  height?: number;
  /** `light` = white mark on dark footer (`bg-ink`). Default = dark logo on light bg. */
  variant?: "ink" | "light";
};

const LOGO_ASPECT = 1650 / 905;

/** Inline SVG mask (see `FloretLogoSvg`) renders sharper on iOS than `<img src="/logo.svg">`. */
export function Logo({
  className,
  height = 22,
  variant = "ink",
}: Props) {
  const heightPx = height % 2 === 0 ? height : height + 1;
  const widthPx = Math.max(2, Math.round(heightPx * LOGO_ASPECT));
  return (
    <FloretLogoSvg
      heightPx={heightPx}
      widthPx={widthPx}
      variant={variant}
      className={className}
    />
  );
}
