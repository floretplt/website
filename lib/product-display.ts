import type { ProductRow } from "@/lib/types/database";
import type { Locale } from "@/i18n/routing";
import type { Size } from "@/lib/constants";
import { SIZES } from "@/lib/constants";

export function productName(p: ProductRow, locale: Locale) {
  return locale === "uk" ? p.name_uk : p.name_en;
}

export function productDescription(p: ProductRow, locale: Locale) {
  const d = locale === "uk" ? p.description_uk : p.description_en;
  return d ?? "";
}

const SIZE_KEYS: Record<Size, keyof ProductRow> = {
  small: "price_uah_small",
  medium: "price_uah_medium",
  large: "price_uah_large",
};

function tierUah(p: ProductRow, size: Size): number | null {
  const v = p[SIZE_KEYS[size]];
  if (v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function tierEur(p: ProductRow, size: Size): number | null {
  const key =
    size === "small"
      ? "price_eur_small"
      : size === "medium"
        ? "price_eur_medium"
        : "price_eur_large";
  const v = p[key];
  if (v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Price for one size tier, or null if that tier is not sold. */
export function productPriceForSize(
  p: ProductRow,
  locale: Locale,
  size: Size,
): number | null {
  return locale === "uk" ? tierUah(p, size) : tierEur(p, size);
}

/** Sizes that have a price in the active currency (client can order). */
export function offeredSizes(p: ProductRow, locale: Locale): Size[] {
  return SIZES.filter((s) => productPriceForSize(p, locale, s) != null);
}

/** Minimum priced tier among offered sizes. */
export function productMinPrice(p: ProductRow, locale: Locale): number {
  const vals = offeredSizes(p, locale)
    .map((s) => productPriceForSize(p, locale, s))
    .filter((n): n is number => n != null);
  if (vals.length === 0) return 0;
  return Math.min(...vals);
}

/** Maximum priced tier among offered sizes (filters / schema.org). */
export function productMaxPrice(p: ProductRow, locale: Locale): number {
  const vals = offeredSizes(p, locale)
    .map((s) => productPriceForSize(p, locale, s))
    .filter((n): n is number => n != null);
  if (vals.length === 0) return 0;
  return Math.max(...vals);
}

/** @deprecated Prefer productPriceForSize with explicit size. */
export function productPriceAmount(p: ProductRow, locale: Locale) {
  const m = productPriceForSize(p, locale, "medium");
  if (m != null) return m;
  const f = offeredSizes(p, locale)[0];
  return f ? productPriceForSize(p, locale, f)! : 0;
}

export function productCurrency(locale: Locale): "UAH" | "EUR" {
  return locale === "uk" ? "UAH" : "EUR";
}

function resolveStoragePath(path: string): string | null {
  if (path.startsWith("http")) return path;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;
  return `${base}/storage/v1/object/public/products/${path}`;
}

export function primaryImage(p: ProductRow): string | null {
  if (p.image_url) return resolveStoragePath(p.image_url) ?? p.image_url;
  const imgs = p.images;
  if (imgs && Array.isArray(imgs) && imgs[0]) {
    return resolveStoragePath(imgs[0] as string);
  }
  return null;
}

export function galleryUrls(p: ProductRow): string[] {
  const out: string[] = [];
  const add = (path: string | null | undefined) => {
    if (!path) return;
    const u = resolveStoragePath(path) ?? path;
    if (!out.includes(u)) out.push(u);
  };
  add(p.image_url);
  const imgs = (p.images as string[] | null) ?? [];
  for (const path of imgs) {
    add(path);
  }
  return out;
}
