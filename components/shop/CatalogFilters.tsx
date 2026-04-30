"use client";

import { useRouter, usePathname } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { COLOR_MOODS } from "@/lib/constants";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronDown, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  minPrice: number;
  maxPrice: number;
  /** Shown after price inputs (e.g. грн / €). */
  priceSuffix: string;
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

export function CatalogFilters({ minPrice, maxPrice, priceSuffix }: Props) {
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

  const spKey = sp.toString();

  const meaningfulActiveFilters = useMemo(() => {
    if (sp.get("mood")) return true;
    if (sp.has("min")) {
      const n = Number(sp.get("min"));
      if (!Number.isNaN(n) && n !== minPrice) return true;
    }
    if (sp.has("max")) {
      const n = Number(sp.get("max"));
      if (!Number.isNaN(n) && n !== maxPrice) return true;
    }
    return false;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- URLSearchParams identity is unstable
  }, [spKey, minPrice, maxPrice]);

  const hasUrlFilterParams = useMemo(
    () => sp.has("mood") || sp.has("min") || sp.has("max"),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [spKey],
  );

  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (meaningfulActiveFilters) setOpen(true);
  }, [meaningfulActiveFilters]);

  const clearFilters = useCallback(() => {
    router.push(pathname);
  }, [pathname, router]);

  return (
    <aside className="space-y-0 border-b border-ink/10 pb-5 md:border-0 md:pb-0">
      <div className="overflow-hidden rounded-2xl border border-ink/10 bg-white/95 shadow-sm ring-1 ring-ink/[0.03] lg:sticky lg:top-28 lg:self-start">
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors hover:bg-ink/[0.02] sm:px-5 sm:py-4 md:px-6"
        >
          <span className="flex min-w-0 flex-1 items-center gap-2.5">
            <SlidersHorizontal className="h-4 w-4 shrink-0 text-muted" strokeWidth={1.75} aria-hidden />
            <span className="eyebrow mb-0 inline-flex items-center gap-2">
              <span>{t("filters")}</span>
              <ChevronDown
                className={cn(
                  "h-4 w-4 shrink-0 text-muted transition-transform duration-300 ease-out",
                  open && "rotate-180",
                )}
                aria-hidden
              />
            </span>
          </span>
          {meaningfulActiveFilters ? (
            <span
              className="inline-flex h-2 w-2 shrink-0 rounded-full bg-ink"
              title={t("filtersActiveHint")}
              aria-label={t("filtersActiveHint")}
            />
          ) : null}
        </button>

        <div
          className={cn(
            "grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
            open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
          )}
        >
          <div className="min-h-0 overflow-hidden">
            <div className="space-y-8 border-t border-ink/10 px-4 pb-5 pt-5 sm:px-6 sm:pb-6 sm:pt-6">
              <div>
                <p className="mb-3 text-sm font-medium uppercase tracking-[0.12em] text-muted md:text-[11px] md:tracking-[0.15em]">
                  {t("colorMood")}
                </p>
                <div className="grid grid-cols-3 gap-x-2 gap-y-4 sm:max-w-none">
                  {COLOR_MOODS.map((m) => {
                    const chip = MOOD_CHIP[m];
                    const selected = moodVal === m;
                    return (
                      <button
                        key={m}
                        type="button"
                        title={tm(m)}
                        onClick={() => setParam("mood", selected ? null : m)}
                        className={`flex flex-col items-center gap-1.5 rounded-lg p-1 transition-colors hover:bg-ink/[0.03] ${
                          selected ? "bg-ink/[0.04]" : ""
                        }`}
                      >
                        <span
                          className={`h-9 w-9 shrink-0 rounded-full border-2 shadow-sm ring-2 ring-offset-2 ring-offset-white ${
                            selected ? "border-ink" : "border-transparent"
                          } ${chip.ring}`}
                          style={{
                            background: chip.fill,
                          }}
                        />
                        <span
                          className={`max-w-[5.25rem] text-center text-xs font-medium leading-tight md:max-w-[4.75rem] md:text-[10px] ${
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
                <p className="mb-2 text-sm font-medium uppercase tracking-[0.12em] text-muted md:text-[11px] md:tracking-[0.15em]">
                  {t("price")}
                </p>
                <div className="flex min-w-0 flex-wrap items-center gap-2 text-base sm:text-sm">
                  <input
                    type="number"
                    className="form-input min-w-0 flex-1 tabular-nums sm:min-w-[4.5rem] sm:flex-none"
                    value={minV}
                    min={minPrice}
                    max={maxPrice}
                    onChange={(e) => setParam("min", e.target.value)}
                  />
                  <span className="text-muted">—</span>
                  <input
                    type="number"
                    className="form-input min-w-0 flex-1 tabular-nums sm:min-w-[4.5rem] sm:flex-none"
                    value={maxV}
                    min={minPrice}
                    max={maxPrice}
                    onChange={(e) => setParam("max", e.target.value)}
                  />
                  <span className="w-full pl-0.5 text-sm font-medium uppercase tracking-[0.06em] text-muted sm:ml-1 sm:w-auto md:text-[11px] md:tracking-[0.08em]">
                    {priceSuffix}
                  </span>
                </div>
              </div>

              {hasUrlFilterParams ? (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="w-full rounded-full border border-ink/15 bg-[#F3F1EE] px-4 py-2.5 text-sm font-semibold uppercase tracking-[0.1em] text-ink transition-[background-color,border-color] hover:border-ink/25 hover:bg-[#ECE8E3] md:text-[11px] md:tracking-[0.14em]"
                >
                  {t("resetFilters")}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
