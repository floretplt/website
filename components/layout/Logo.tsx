import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  height?: number;
};

const LOGO_ASPECT = 1650 / 905;

export function Logo({ className, height = 22 }: Props) {
  const width = Math.round(height * LOGO_ASPECT);
  return (
    <span
      role="img"
      aria-label="Floret Poltava"
      className={cn("inline-block bg-current align-middle", className)}
      style={{
        width,
        height,
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
