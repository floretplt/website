import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["uk", "en"],
  defaultLocale: "uk",
  localePrefix: "as-needed",
  // Ukrainian by default; English only when the visitor opens /en or uses the toggle.
  localeDetection: false,
});

export type Locale = (typeof routing.locales)[number];
