/** Catalog / order size tokens → S / M / L for Telegram and admin. */
export function bouquetSizeLetter(size: string | null | undefined): string {
  if (size === "small") return "S";
  if (size === "medium") return "M";
  if (size === "large") return "L";
  return size?.trim() ? String(size) : "—";
}
