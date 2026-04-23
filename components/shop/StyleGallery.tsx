import Image from "next/image";
import type { StyleGalleryItem } from "@/lib/style-gallery";
import { Link } from "@/i18n/navigation";

function aspectClass(i: number) {
  const patterns = [
    "aspect-[3/4]",
    "aspect-square",
    "aspect-[4/5]",
    "aspect-[2/3]",
    "aspect-[5/4]",
    "aspect-[3/4]",
  ];
  return patterns[i % patterns.length];
}

type Props = {
  items: StyleGalleryItem[];
  title: string;
  subtitle?: string;
  cta: string;
};

export function StyleGallery({ items, title, subtitle, cta }: Props) {
  if (items.length === 0) return null;

  return (
    <section className="border-t border-ink/10 bg-bg py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-6 md:px-10">
        <h2 className="h-section text-center">{title}</h2>
        {subtitle?.trim() ? (
          <p className="mx-auto mt-5 max-w-2xl text-center text-sm leading-relaxed text-muted md:text-[15px]">
            {subtitle}
          </p>
        ) : null}

        <div className="mt-14 columns-1 gap-x-6 sm:columns-2 lg:columns-3 lg:[column-gap:1.75rem]">
          {items.map((item, index) => (
            <div
              key={`${item.src}-${index}`}
              className="mb-10 break-inside-avoid [content-visibility:auto] [contain-intrinsic-size:auto_420px]"
            >
              <div
                className={`relative w-full overflow-hidden bg-ink/[0.04] ${aspectClass(index)}`}
              >
                <Image
                  src={item.src}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 45vw, 28vw"
                  loading="lazy"
                  fetchPriority="low"
                  decoding="async"
                />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-14 flex justify-center">
          <Link href="/catalog" className="btn-pill">
            {cta}
          </Link>
        </div>
      </div>
    </section>
  );
}
