/** Hourly pickup slots (exact window), Europe/Kyiv wall-clock. */

export const PICKUP_FIRST_HOUR = 9;
export const PICKUP_LAST_START_HOUR = 18;

/** Values like "10:00–11:00" for storage in orders.delivery_time */
export function pickupTimeSlotValues(): string[] {
  const out: string[] = [];
  for (let h = PICKUP_FIRST_HOUR; h <= PICKUP_LAST_START_HOUR; h++) {
    const end = h + 1;
    out.push(
      `${String(h).padStart(2, "0")}:00–${String(end).padStart(2, "0")}:00`,
    );
  }
  return out;
}
