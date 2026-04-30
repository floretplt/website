import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["uk"],
  defaultLocale: "uk",
  /** Single locale: keep public URLs without a `/uk` segment (same as former default-locale paths). */
  localePrefix: "never",
  localeDetection: false,
});

export type Locale = (typeof routing.locales)[number];
