import type { ReactNode } from "react";
import {
  cmsHtmlToPlainishWithBoldMarkers,
  looksLikeMarkup,
} from "@/lib/cms-product-description";

/** Split on `**bold**` into text + <strong> nodes (CMS description). */
function segmentsWithBold(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const re = /\*\*([\s\S]+?)\*\*/g;
  let last = 0;
  let k = 0;
  for (const m of text.matchAll(re)) {
    const start = m.index ?? 0;
    if (start > last) {
      nodes.push(text.slice(last, start));
    }
    nodes.push(
      <strong key={k++} className="font-semibold text-ink">
        {m[1]}
      </strong>,
    );
    last = start + m[0].length;
  }
  if (last < text.length) {
    nodes.push(text.slice(last));
  }
  return nodes;
}

type Props = {
  text: string;
  className?: string;
};

/**
 * Renders `description_uk`: paragraph breaks, `**bold**`, and common HTML from admin
 * (`<p>`, `<strong>`, `<b>`, `<br>`, lists) converted safely to React (no raw HTML injection).
 */
export function CmsProductDescription({ text, className }: Props) {
  const trimmed = text.trim();
  if (!trimmed) return null;
  const body = looksLikeMarkup(trimmed)
    ? cmsHtmlToPlainishWithBoldMarkers(trimmed)
    : trimmed;
  const paragraphs = body.trim().split(/\n\n+/);
  return (
    <div className={className}>
      {paragraphs.map((p, i) => (
        <p key={i}>{segmentsWithBold(p)}</p>
      ))}
    </div>
  );
}
