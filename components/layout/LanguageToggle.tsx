"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

export function LanguageToggle() {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();

  const next: Locale = locale === "uk" ? "en" : "uk";

  return (
    <button
      type="button"
      onClick={() => router.replace(pathname, { locale: next })}
      className="text-xs font-medium uppercase tracking-[0.15em] text-ink transition-colors hover:text-rose"
      aria-label={next === "en" ? "English" : "Українська"}
    >
      {locale === "uk" ? "EN" : "UK"}
    </button>
  );
}
