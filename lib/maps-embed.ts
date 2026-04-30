/** Google Maps iframe `src` from a free-text address (synced with site settings). */
export function googleMapsEmbedSrc(address: string): string {
  const q = encodeURIComponent(address.trim());
  return `https://maps.google.com/maps?q=${q}&hl=uk&z=17&output=embed`;
}
