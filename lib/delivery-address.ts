/** Stored as `delivery_address` when the sender does not know the street yet. */
export const DELIVERY_ADDRESS_PENDING_WITH_RECIPIENT_UK =
  "Адресу будемо уточнювати з отримувачем";
export const DELIVERY_ADDRESS_PENDING_WITH_RECIPIENT_EN =
  "Address will be confirmed with the recipient";

/** Merge optional floor / apartment into one address block for storage & couriers. */
export function mergeDeliveryAddressParts(
  base: string | null | undefined,
  floor?: string | null,
  apartment?: string | null,
): string | null {
  const line = base?.trim();
  if (!line) return null;
  const parts = [line];
  const f = floor?.trim();
  const a = apartment?.trim();
  if (f) parts.push(`Поверх: ${f}`);
  if (a) parts.push(`Квартира: ${a}`);
  return parts.join("\n");
}
