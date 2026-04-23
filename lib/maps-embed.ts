/** Google Maps iframe `src` from a free-text address (synced with site settings). */
export function googleMapsEmbedSrc(address: string, locale: string): string {
  const q = encodeURIComponent(address.trim());
  const hl = locale === "uk" ? "uk" : "en";
  return `https://maps.google.com/maps?q=${q}&hl=${hl}&z=17&output=embed`;
}
