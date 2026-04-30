import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  href: string;
  imageSrc: string;
  disabled?: boolean;
  comingLabel?: string;
};

export function CategoryTile({
  title,
  href,
  imageSrc,
  disabled,
  comingLabel,
}: Props) {
  const content = (interactive: boolean) => (
    <>
      <div className="relative aspect-square w-full overflow-hidden bg-bg">
        <Image
          src={imageSrc}
          alt=""
          fill
          className={cn(
            "object-cover",
            interactive &&
              "transition-transform duration-700 ease-out group-hover:scale-[1.04]",
          )}
          sizes="(max-width:768px) 100vw, 33vw"
          loading="lazy"
          fetchPriority="low"
        />
      </div>
      <div
        className={cn(
          "mt-3 flex items-center justify-between gap-3 border border-ink px-4 py-3 text-sm font-medium uppercase tracking-[0.12em] md:text-[11px] md:tracking-[0.18em]",
          interactive &&
            "transition-colors duration-300 group-hover:border-ink/80",
        )}
      >
        <span className="min-w-0 flex-1 truncate">{title}</span>
        {disabled && comingLabel ? (
          <span className="shrink-0 text-muted">{comingLabel}</span>
        ) : (
          <ArrowRight
            className={cn(
              "h-4 w-4 shrink-0",
              interactive &&
                "transition-transform duration-300 ease-out group-hover:translate-x-0.5",
            )}
            strokeWidth={1}
          />
        )}
      </div>
    </>
  );

  if (disabled) {
    return (
      <div className="opacity-60">
        <div className="pointer-events-none">{content(false)}</div>
      </div>
    );
  }

  return (
    <Link href={href} className="group block">
      {content(true)}
    </Link>
  );
}
