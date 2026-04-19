"use client";

import { useRouter, usePathname } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { COLOR_MOODS } from "@/lib/constants";
import { useCallback } from "react";

type Props = {
  minPrice: number;
  maxPrice: number;
};

/** Visual chips aligned with admin labels (Рожевий, Блакитний, …). */
const MOOD_CHIP: Record<
  (typeof COLOR_MOODS)[number],
  { fill: string; ring: string }
> = {
  pink: { fill: "#e5989b", ring: "ring-rose-300/80" },
  blue: { fill: "#6ea8d8", ring: "ring-sky-400/70" },
  yellow: { fill: "#e6c229", ring: "ring-amber-400/80" },
  red: { fill: "#c73e3e", ring: "ring-red-500/60" },
  white: { fill: "#ffffff", ring: "ring-ink/20" },
  bright: { fill: "linear-gradient(135deg,#ff8c42 0%,#f5d547 50%,#e85d8e 100%)", ring: "ring-orange-400/60" },
};

export function CatalogFilters({ minPrice, maxPrice }: Props) {
  const t = useTranslations("catalog");
  const tm = useTranslations("moods");
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const setParam = useCallback(
    (key: string, value: string | null) => {
      const next = new URLSearchParams(sp.toString());
      if (value === null || value === "") {
        next.delete(key);
      } else {
        next.set(key, value);
      }
      router.push(`${pathname}?${next.toString()}`);
    },
    [pathname, router, sp],
  );

  const moodVal = sp.get("mood") ?? "";
  const minV = sp.get("min") ?? String(minPrice);
  const maxV = sp.get("max") ?? String(maxPrice);

  return (
    <aside className="space-y-8 border-b border-ink/10 pb-8 md:border-b-0 md:border-r md:border-ink/10 md:pb-0 md:pr-8">
      <p className="eyebrow">{t("filters")}</p>

      <div>
        <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.15em] text-muted">
          {t("colorMood")}
        </p>
        <div className="flex flex-wrap gap-3">
          {COLOR_MOODS.map((m) => {
            const chip = MOOD_CHIP[m];
            const selected = moodVal === m;
            return (
              <button
                key={m}
                type="button"
                title={tm(m)}
                onClick={() => setParam("mood", selected ? null : m)}
                className={`flex flex-col items-center gap-1.5 rounded-md p-1 transition-opacity hover:opacity-90 ${
                  selected ? "opacity-100" : "opacity-95"
                }`}
              >
                <span
                  className={`h-8 w-8 shrink-0 rounded-full border-2 shadow-sm ring-2 ring-offset-1 ring-offset-bg ${
                    selected ? "border-ink" : "border-transparent"
                  } ${chip.ring}`}
                  style={{
                    background: chip.fill,
                  }}
                />
                <span
                  className={`max-w-[4.5rem] text-center text-[10px] font-medium leading-tight ${
                    selected ? "text-ink" : "text-muted"
                  }`}
                >
                  {tm(m)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.15em] text-muted">
          {t("price")}
        </p>
        <div className="flex gap-2 text-sm">
          <input
            type="number"
            className="w-full border border-ink/20 bg-transparent px-2 py-1"
            value={minV}
            min={minPrice}
            max={maxPrice}
            onChange={(e) => setParam("min", e.target.value)}
          />
          <span className="self-center text-muted">—</span>
          <input
            type="number"
            className="w-full border border-ink/20 bg-transparent px-2 py-1"
            value={maxV}
            min={minPrice}
            max={maxPrice}
            onChange={(e) => setParam("max", e.target.value)}
          />
        </div>
      </div>
    </aside>
  );
}
