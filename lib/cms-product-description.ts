/**
 * Normalizes common CMS HTML into plain text + `**bold**` markers, then callers
 * can render with React (no raw `dangerouslySetInnerHTML`).
 */
export function looksLikeMarkup(s: string): boolean {
  return /<\/?(p|strong|b|br|em|span|div|ul|ol|li)\b/i.test(s);
}

/** Strip risky blocks/tags, map semantic inline tags to `**`, drop other tags. */
export function cmsHtmlToPlainishWithBoldMarkers(raw: string): string {
  return (
    raw
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>\s*<p\b[^>]*>/gi, "\n\n")
      .replace(/<p\b[^>]*>/gi, "")
      .replace(/<\/p>/gi, "\n\n")
      .replace(/<div\b[^>]*>/gi, "")
      .replace(/<\/div>/gi, "\n\n")
      .replace(/<ul\b[^>]*>/gi, "")
      .replace(/<\/ul>/gi, "\n\n")
      .replace(/<ol\b[^>]*>/gi, "")
      .replace(/<\/ol>/gi, "\n\n")
      .replace(/<li\b[^>]*>/gi, "– ")
      .replace(/<\/li>/gi, "\n")
      .replace(/<strong\b[^>]*>/gi, "**")
      .replace(/<\/strong>/gi, "**")
      .replace(/<b\b[^>]*>/gi, "**")
      .replace(/<\/b>/gi, "**")
      .replace(/<em\b[^>]*>/gi, "")
      .replace(/<\/em>/gi, "")
      .replace(/<span\b[^>]*>/gi, "")
      .replace(/<\/span>/gi, "")
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/gi, " ")
      .replace(/&mdash;/gi, "—")
      .replace(/&ndash;/gi, "–")
      .replace(/&amp;/gi, "&")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
      .replace(/&quot;/gi, '"')
      .replace(/&#(\d+);/g, (full, n) => {
        const code = Number(n);
        return Number.isFinite(code) ? String.fromCharCode(code) : full;
      })
  );
}

/** Collapse `**` markers for JSON-LD / plain previews. */
export function stripBoldMarkers(s: string): string {
  return s.replace(/\*\*([\s\S]+?)\*\*/g, "$1");
}

/** One line-ish plain string for schema.org. */
export function productDescriptionPlainForSchema(raw: string): string {
  const t = raw.trim();
  if (!t) return "";
  const normalized = looksLikeMarkup(t)
    ? cmsHtmlToPlainishWithBoldMarkers(t)
    : t;
  return stripBoldMarkers(normalized).replace(/\s+/g, " ").trim();
}
