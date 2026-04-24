/**
 * Human-readable Ukrainian labels for stored `orders.delivery_time` / form values.
 * Matches storefront copy in messages/uk.json (order.timeMorning, etc.).
 */
const DELIVERY_WINDOW_UK: Record<string, string> = {
  morning: "Ранок (9–12)",
  afternoon: "День (12–16)",
  evening: "Вечір (до 19)",
};

/** Maps morning|afternoon|evening to Ukrainian range; leaves pickup slots (e.g. 09:00–10:00) as-is. */
export function formatStoredDeliveryTimeUk(
  stored: string | null | undefined,
): string {
  const t = stored?.trim();
  if (!t) return "";
  const mapped = DELIVERY_WINDOW_UK[t];
  if (mapped) return mapped;
  return t;
}
