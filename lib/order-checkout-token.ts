import crypto from "crypto";

const COOKIE_NAME = "floret_order_checkout";
const MAX_AGE_SEC = 7200;

function secret(): string | null {
  const s =
    process.env.ORDER_CHECKOUT_SECRET?.trim() ||
    process.env.LIQPAY_PRIVATE_KEY?.trim();
  return s || null;
}

function sign(payload: string): string {
  const key = secret();
  if (!key) throw new Error("ORDER_CHECKOUT_SECRET not configured");
  return crypto.createHmac("sha256", key).update(payload).digest("base64url");
}

/** Issue HMAC token bound to order id (short-lived). */
export function createOrderCheckoutToken(orderId: string): string {
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE_SEC;
  const body = `${orderId}.${exp}`;
  const sig = sign(body);
  return `${body}.${sig}`;
}

export function verifyOrderCheckoutToken(
  token: string | undefined,
  orderId: string,
): boolean {
  if (!token || !secret()) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [id, expStr, sig] = parts;
  if (id !== orderId) return false;
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp < Math.floor(Date.now() / 1000)) return false;
  const body = `${id}.${expStr}`;
  try {
    const expected = sign(body);
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function orderCheckoutCookieHeader(orderId: string): string {
  const token = createOrderCheckoutToken(orderId);
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const secure =
    site.startsWith("https://") || process.env.NODE_ENV === "production"
      ? "; Secure"
      : "";
  return `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; Max-Age=${MAX_AGE_SEC}; SameSite=Lax; HttpOnly${secure}`;
}

export function orderCheckoutCookieName(): string {
  return COOKIE_NAME;
}

export function readOrderCheckoutTokenFromCookie(
  raw: string | undefined,
): string | undefined {
  if (!raw) return undefined;
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}
