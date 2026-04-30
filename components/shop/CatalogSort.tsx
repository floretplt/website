"use client";

import { useRouter, usePathname } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useTransition } from "react";

export function CatalogSort() {
  const t = useTranslations("catalog");
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [pending, startTransition] = useTransition();

  const value = sp.get("sort") === "popular" ? "popular" : "default";

  const onChange = useCallback(
    (next: string) => {
      const params = new URLSearchParams(sp.toString());
      if (next === "default" || next === "") {
        params.delete("sort");
      } else {
        params.set("sort", next);
      }
      const q = params.toString();
      startTransition(() => {
        router.push(q ? `${pathname}?${q}` : pathname);
      });
    },
    [pathname, router, sp],
  );

  return (
    <label className="flex items-center gap-2 text-sm uppercase tracking-[0.08em] text-muted md:text-[11px] md:tracking-[0.12em]">
      <span className="sr-only">{t("sort")}</span>
      <select
        value={value}
        disabled={pending}
        onChange={(e) => onChange(e.target.value)}
        className="min-w-[11rem] cursor-pointer appearance-none rounded-lg border border-ink/15 bg-white py-2.5 pl-3 pr-9 text-sm font-medium uppercase tracking-[0.08em] text-ink shadow-sm transition-[border-color,box-shadow] focus-visible:border-ink/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/10 disabled:opacity-60 md:text-[11px] md:tracking-[0.12em]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236B6B66' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 0.65rem center",
        }}
      >
        <option value="default">{t("sortDefault")}</option>
        <option value="popular">{t("sortPopular")}</option>
      </select>
    </label>
  );
}
