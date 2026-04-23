/**
 * Absolute HTTPS URL for Telegram and other servers that fetch by URL.
 * Relative paths are resolved with `NEXT_PUBLIC_SITE_URL`.
 */
export function publicAssetAbsoluteUrl(
  raw: string | null | undefined,
): string | null {
  if (!raw?.trim()) return null;
  const u = raw.trim();
  if (u.startsWith("http://") || u.startsWith("https://")) return u;
  const base = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "";
  if (!base) return null;
  return u.startsWith("/") ? `${base}${u}` : `${base}/${u}`;
}
