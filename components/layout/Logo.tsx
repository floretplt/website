import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  height?: number;
};

const LOGO_ASPECT = 1650 / 905;

export function Logo({ className, height = 22 }: Props) {
  /** Even CSS px sizes reduce fuzzy edges when the mask is composited on mobile. */
  const heightPx = height % 2 === 0 ? height : height + 1;
  const widthPx = Math.max(2, Math.round((heightPx * LOGO_ASPECT) / 2) * 2);
  return (
    <span
      role="img"
      aria-label="Floret Poltava"
      className={cn(
        "inline-block bg-current align-middle [transform:translateZ(0)]",
        className,
      )}
      style={{
        width: widthPx,
        height: heightPx,
        WebkitMaskImage: "url(/logo.svg)",
        maskImage: "url(/logo.svg)",
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskSize: "contain",
        maskSize: "contain",
        WebkitMaskPosition: "center",
        maskPosition: "center",
      }}
    />
  );
}
