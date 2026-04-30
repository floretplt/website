import { Logo } from "@/components/layout/Logo";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
};

/** Shared logo + bar used by `SitePreloader` and route `loading.tsx`. */
export function PreloaderMark({ className }: Props) {
  return (
    <div className={cn("flex flex-col items-center gap-8", className)}>
      <Logo height={52} fetchPriority="high" />
      <div
        className="h-px w-24 origin-left bg-ink/20 motion-reduce:animate-none animate-preloaderBar"
        aria-hidden
      />
    </div>
  );
}
