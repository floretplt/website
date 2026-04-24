/** First image URL from a product row (for order snapshot / Telegram). */
export function primaryProductImageUrl(p: {
  image_url: string | null;
  images: unknown;
}): string | null {
  if (p.image_url?.trim()) return p.image_url.trim();
  const imgs = p.images;
  if (Array.isArray(imgs) && imgs.length > 0) {
    const first = imgs[0];
    if (typeof first === "string" && first.trim()) return first.trim();
  }
  return null;
}

/**
 * Turn a storage object path or key into a public HTTPS URL (same rule as admin ProductForm).
 * Telegram and `<img>` need absolute URLs; DB often stores only the path inside the bucket.
 */
export function resolvePublicProductImageUrl(
  raw: string | null | undefined,
): string | null {
  const u = raw?.trim();
  if (!u) return null;
  if (u.startsWith("http://") || u.startsWith("https://")) return u;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "") ?? "";
  if (!base) return null;
  if (u.startsWith("/")) return `${base}${u}`;
  return `${base}/storage/v1/object/public/products/${u}`;
}
