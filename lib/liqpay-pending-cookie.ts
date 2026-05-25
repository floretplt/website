export const FLORET_LIQPAY_COOKIE = "floret_liqpay_pending";
/** Same-tab backup (works better than cookies in some Incognito flows). */
export const FLORET_LIQPAY_STORAGE_KEY = "floret_liqpay_pending";

export type PendingLiqPayCookie = {
  orderId: string;
  orderNumber: number;
  liqpayOrderId: string;
  ts: number;
};

function parsePendingRaw(raw: string, decodeUri: boolean): PendingLiqPayCookie | null {
  if (!raw) return null;
  try {
    const p = JSON.parse(decodeUri ? decodeURIComponent(raw) : raw) as PendingLiqPayCookie;
    if (
      typeof p.orderId !== "string" ||
      typeof p.liqpayOrderId !== "string" ||
      !Number.isFinite(p.orderNumber) ||
      p.orderNumber < 1
    ) {
      return null;
    }
    if (Date.now() - (p.ts ?? 0) > 2 * 60 * 60 * 1000) return null;
    return p;
  } catch {
    return null;
  }
}

export function parsePendingLiqPayCookie(
  raw: string | undefined,
): PendingLiqPayCookie | null {
  if (!raw) return null;
  return parsePendingRaw(raw, true);
}

export function parsePendingLiqPayJson(
  raw: string | undefined,
): PendingLiqPayCookie | null {
  if (!raw) return null;
  return parsePendingRaw(raw, false);
}

export function serializePendingLiqPay(
  pending: Omit<PendingLiqPayCookie, "ts">,
): string {
  return JSON.stringify({ ...pending, ts: Date.now() } satisfies PendingLiqPayCookie);
}

export function formatPendingLiqPayCookieValue(
  pending: Omit<PendingLiqPayCookie, "ts">,
): string {
  return encodeURIComponent(serializePendingLiqPay(pending));
}

export function pendingLiqPayCookieHeader(
  pending: Omit<PendingLiqPayCookie, "ts">,
): string {
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const secure =
    site.startsWith("https://") || process.env.NODE_ENV === "production"
      ? "; Secure"
      : "";
  return `${FLORET_LIQPAY_COOKIE}=${formatPendingLiqPayCookieValue(pending)}; Path=/; Max-Age=7200; SameSite=Lax${secure}`;
}
