"use client";

import { useMemo, useState } from "react";
import type { ProductRow } from "@/lib/types/database";
import type { ProductCategory } from "@/lib/constants";
import { ProductCard } from "@/components/shop/ProductCard";
import { Link } from "@/i18n/navigation";
import { Reveal } from "@/components/animations/Reveal";

const tabs: { id: ProductCategory | "all" }[] = [
  { id: "all" },
  { id: "bouquets" },
  { id: "box-bouquets" },
];

type Props = {
  products: ProductRow[];
  title: string;
  subtitle?: string;
  cta: string;
  labels: {
    tabAll: string;
    catBouquets: string;
    catBox: string;
    order: string;
    priceFrom: string;
    moods: Record<string, string>;
  };
};

export function HomeFeatured({
  products,
  title,
  subtitle,
  cta,
  labels,
}: Props) {
  const [tab, setTab] = useState<(typeof tabs)[number]["id"]>("all");

  const filtered = useMemo(() => {
    if (tab === "all") return products.slice(0, 4);
    return products.filter((p) => p.category === tab).slice(0, 4);
  }, [products, tab]);

  return (
    <section id="style-bouquets" className="scroll-mt-24 bg-white py-16 md:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 md:px-10">
        <Reveal>
          <h2 className="h-section text-center">{title}</h2>
          {subtitle ? (
            <p className="text-ui-muted mx-auto mt-4 max-w-xl text-center">
              {subtitle}
            </p>
          ) : null}
        </Reveal>
        <div className="mt-8 -mx-4 flex justify-start gap-5 overflow-x-auto overscroll-x-contain px-4 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:justify-center sm:gap-7 sm:overflow-visible sm:px-0 sm:pb-0 [&::-webkit-scrollbar]:hidden">
          {tabs.map((t) => {
            const label =
              t.id === "all"
                ? labels.tabAll
                : t.id === "bouquets"
                  ? labels.catBouquets
                  : labels.catBox;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={
                  (tab === t.id ? "tab-link tab-link-active" : "tab-link border-b border-transparent pb-0.5") +
                  " shrink-0 whitespace-nowrap py-1"
                }
              >
                {label}
              </button>
            );
          })}
        </div>
        <div className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {filtered.map((p, index) => (
            <Reveal key={p.id} delayMs={index * 70}>
              <ProductCard
                product={p}
                category={p.category}
                moodLabel={labels.moods[p.color_mood] ?? p.color_mood}
                orderLabel={labels.order}
                variant="catalog"
                priceFromPrefix={labels.priceFrom}
                showOrderCta
                showSizeTiers
                deferredImage={index >= 2}
              />
            </Reveal>
          ))}
        </div>
        <div className="mt-12 flex justify-center">
          <Reveal delayMs={120}>
            <Link href="/catalog" className="btn-pill">
              {cta}
            </Link>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
