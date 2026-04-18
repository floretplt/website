import type { MetadataRoute } from "next";
import { CATALOG_BROWSE_CATEGORIES } from "@/lib/constants";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const locales = ["", "/en"];
  const paths = [
    "",
    "/about",
    "/contact",
    "/order",
    "/wedding",
    "/catalog/bouquets",
    "/catalog/box-bouquets",
  ];

  const entries: MetadataRoute.Sitemap = [];

  for (const loc of locales) {
    for (const p of paths) {
      entries.push({
        url: `${base}${loc}${p}`,
        lastModified: new Date(),
      });
    }
  }

  for (const loc of locales) {
    for (const cat of CATALOG_BROWSE_CATEGORIES) {
      entries.push({
        url: `${base}${loc}/catalog/${cat}`,
        lastModified: new Date(),
      });
    }
  }

  return entries;
}
