"use client";

import { useLocale } from "next-intl";
import { useEffect } from "react";

export function LocaleHtml({ children }: { children: React.ReactNode }) {
  const locale = useLocale();
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  return <>{children}</>;
}
