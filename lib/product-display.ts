import type { ProductRow } from "@/lib/types/database";
import type { Size } from "@/lib/constants";
import { SIZES } from "@/lib/constants";

export function productName(p: ProductRow) {
  return p.name_uk;
}

export function productDescription(p: ProductRow) {
  return p.description_uk ?? "";
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

/** Price for one size tier, or null if that tier is not sold. */
export function productPriceForSize(p: ProductRow, size: Size): number | null {
  return tierUah(p, size);
}

/** Sizes that have a price in the active currency (client can order). */
export function offeredSizes(p: ProductRow): Size[] {
  return SIZES.filter((s) => productPriceForSize(p, s) != null);
}

/**
 * Minimum allowed `price_paid` for a catalog product: size S when that tier is sold;
 * otherwise the cheapest offered tier (e.g. M-only compositions).
 */
export function productSmallTierFloorPrice(p: ProductRow): number | null {
  const offered = offeredSizes(p);
  if (offered.includes("small")) {
    const v = productPriceForSize(p, "small");
    if (v != null && v > 0) return v;
  }
  const lo = productMinPrice(p);
  return lo > 0 ? lo : null;
}

/** Minimum priced tier among offered sizes. */
export function productMinPrice(p: ProductRow): number {
  const vals = offeredSizes(p)
    .map((s) => productPriceForSize(p, s))
    .filter((n): n is number => n != null);
  if (vals.length === 0) return 0;
  return Math.min(...vals);
}

/** Maximum priced tier among offered sizes (filters / schema.org). */
export function productMaxPrice(p: ProductRow): number {
  const vals = offeredSizes(p)
    .map((s) => productPriceForSize(p, s))
    .filter((n): n is number => n != null);
  if (vals.length === 0) return 0;
  return Math.max(...vals);
}

/** @deprecated Prefer productPriceForSize with explicit size. */
export function productPriceAmount(p: ProductRow) {
  const m = productPriceForSize(p, "medium");
  if (m != null) return m;
  const f = offeredSizes(p)[0];
  return f ? productPriceForSize(p, f)! : 0;
}

export function productCurrency(): "UAH" | "EUR" {
  return "UAH";
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
    return resolveStoragePath(imgs[0] as string) ?? (imgs[0] as string);
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
