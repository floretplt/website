import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { ArrowRight } from "lucide-react";

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
  const inner = (
    <>
      <div className="relative aspect-square w-full overflow-hidden bg-bg">
        <Image
          src={imageSrc}
          alt=""
          fill
          className="object-cover"
          sizes="(max-width:768px) 100vw, 33vw"
          loading="lazy"
          fetchPriority="low"
        />
      </div>
      <div className="mt-3 flex items-center justify-between gap-3 border border-ink px-4 py-3 text-[11px] font-medium uppercase tracking-[0.18em]">
        <span className="min-w-0 flex-1 truncate">{title}</span>
        {disabled && comingLabel ? (
          <span className="shrink-0 text-muted">{comingLabel}</span>
        ) : (
          <ArrowRight className="h-4 w-4 shrink-0" strokeWidth={1} />
        )}
      </div>
    </>
  );

  if (disabled) {
    return (
      <div className="opacity-60">
        <div className="pointer-events-none">{inner}</div>
      </div>
    );
  }

  return <Link href={href}>{inner}</Link>;
}
