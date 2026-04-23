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
