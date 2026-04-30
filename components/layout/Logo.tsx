import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  height?: number;
  /** `light` = white mark on dark footer (`bg-ink`). Default = dark logo on light bg. */
  variant?: "ink" | "light";
  fetchPriority?: "high" | "low" | "auto";
};

const LOGO_ASPECT = 1650 / 905;
const INTRINSIC_W = 1650;
const INTRINSIC_H = 905;

/**
 * Raster-free SVG via `<img>` (vector scales crisply). Avoids CSS `mask-image`,
 * which often looks soft on mobile Safari.
 */
export function Logo({
  className,
  height = 22,
  variant = "ink",
  fetchPriority = "auto",
}: Props) {
  const heightPx = height % 2 === 0 ? height : height + 1;
  const widthPx = Math.max(2, Math.round(heightPx * LOGO_ASPECT));
  return (
    <img
      src="/logo.svg"
      alt="Floret Poltava"
      width={INTRINSIC_W}
      height={INTRINSIC_H}
      decoding="async"
      draggable={false}
      fetchPriority={fetchPriority}
      className={cn(
        "pointer-events-none block max-w-none shrink-0 select-none align-middle",
        variant === "light" && "brightness-0 invert",
        className,
      )}
      style={{
        height: heightPx,
        width: widthPx,
        objectFit: "contain",
      }}
    />
  );
}
