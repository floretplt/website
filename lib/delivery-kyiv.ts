/** Europe/Kyiv — used for same-day delivery cutoffs. */
export const KYIV_TZ = "Europe/Kyiv";

export function kyivCalendarDateString(d = new Date()): string {
  return d.toLocaleDateString("en-CA", { timeZone: KYIV_TZ });
}

/** Minutes from midnight in Kyiv for the given instant. */
export function kyivMinutesSinceMidnight(d = new Date()): number {
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: KYIV_TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = fmt.formatToParts(d);
  const h = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const m = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  return h * 60 + m;
}

/** Parses "HH:MM" or "HH:MM:SS" to minutes since midnight. */
export function parseClockToMinutes(clock: string): number {
  const s = String(clock).trim().slice(0, 5);
  const [h, min] = s.split(":").map((x) => Number(x));
  if (!Number.isFinite(h) || !Number.isFinite(min)) return 0;
  return h * 60 + min;
}

/** Next calendar day in Kyiv as YYYY-MM-DD. */
export function kyivTomorrowString(d = new Date()): string {
  const cur = kyivCalendarDateString(d);
  const [y, mo, day] = cur.split("-").map(Number);
  const nextDay = new Date(Date.UTC(y, mo - 1, day + 1, 12, 0, 0));
  return kyivCalendarDateString(nextDay);
}

/**
 * Earliest selectable delivery date (YYYY-MM-DD): today if before order cutoff, else tomorrow.
 */
export function minDeliveryDateAfterOrderCutoff(
  orderCutoffClock: string,
  now = new Date(),
): string {
  const today = kyivCalendarDateString(now);
  const nowM = kyivMinutesSinceMidnight(now);
  const cutoffM = parseClockToMinutes(orderCutoffClock);
  if (nowM <= cutoffM) return today;
  return kyivTomorrowString(now);
}
