import Image from "next/image";
import type { StyleGalleryItem } from "@/lib/style-gallery";
import { Link } from "@/i18n/navigation";
import { Reveal } from "@/components/animations/Reveal";

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
    <section className="border-t border-ink/10 bg-[#faf9f7] pb-20 pt-28 md:pb-28 md:pt-36">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-10">
        <Reveal>
          <h2 className="h-section text-center">{title}</h2>
          {subtitle?.trim() ? (
            <p className="text-body-muted mx-auto mt-5 max-w-2xl text-center">
              {subtitle}
            </p>
          ) : null}
        </Reveal>

        <div className="mt-14 columns-1 gap-x-6 sm:columns-2 lg:columns-3 lg:[column-gap:1.75rem]">
          {items.map((item, index) => (
            <Reveal
              key={`${item.src}-${index}`}
              delayMs={(index % 6) * 55}
              className="mb-10 break-inside-avoid [content-visibility:auto] [contain-intrinsic-size:auto_420px]"
            >
              <div
                className={`group relative w-full overflow-hidden bg-ink/[0.04] ${aspectClass(index)}`}
              >
                <Image
                  src={item.src}
                  alt=""
                  fill
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 45vw, 28vw"
                  loading="lazy"
                  fetchPriority="low"
                  decoding="async"
                />
              </div>
            </Reveal>
          ))}
        </div>

        <div className="mt-14 flex justify-center">
          <Reveal delayMs={80}>
            <Link href="/catalog" className="btn-pill">
              {cta}
            </Link>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
