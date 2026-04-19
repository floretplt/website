"use client";

import { useMemo, useState } from "react";
import type { ProductRow } from "@/lib/types/database";
import type { Locale } from "@/i18n/routing";
import type { ProductCategory } from "@/lib/constants";
import { ProductCard } from "@/components/shop/ProductCard";
import { Link } from "@/i18n/navigation";

const tabs: { id: ProductCategory | "all" }[] = [
  { id: "all" },
  { id: "bouquets" },
  { id: "box-bouquets" },
];

type Props = {
  products: ProductRow[];
  locale: Locale;
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
  locale,
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
    <section id="style-bouquets" className="scroll-mt-24 bg-white py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-6 md:px-10">
        <h2 className="h-section text-center">{title}</h2>
        {subtitle ? (
          <p className="mx-auto mt-5 max-w-xl text-center text-sm leading-relaxed text-muted">
            {subtitle}
          </p>
        ) : null}
        <div className="mt-8 flex flex-wrap justify-center gap-6 text-[11px] font-medium uppercase tracking-[0.2em] text-muted">
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
                  tab === t.id
                    ? "border-b border-ink text-ink"
                    : "border-b border-transparent hover:text-ink"
                }
              >
                {label}
              </button>
            );
          })}
        </div>
        <div className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {filtered.map((p, index) => (
            <ProductCard
              key={p.id}
              product={p}
              locale={locale}
              category={p.category}
              moodLabel={labels.moods[p.color_mood] ?? p.color_mood}
              orderLabel={labels.order}
              variant="catalog"
              priceFromPrefix={labels.priceFrom}
              showOrderCta
              showSizeTiers
              deferredImage={index >= 2}
            />
          ))}
        </div>
        <div className="mt-12 flex justify-center">
          <Link href="/catalog" className="btn-pill">
            {cta}
          </Link>
        </div>
      </div>
    </section>
  );
}
