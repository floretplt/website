import crypto from "crypto";

const LIQPAY_HOST = "https://www.liqpay.ua/api/";

export function liqpayEncode(data: object): string {
  const json = JSON.stringify(data);
  return Buffer.from(json).toString("base64");
}

function liqpaySignWith(
  algo: "sha1" | "sha3-256",
  dataBase64: string,
  privateKey: string,
): string {
  return crypto
    .createHash(algo)
    .update(privateKey + dataBase64 + privateKey)
    .digest("base64");
}

export function liqpaySign(dataBase64: string, privateKey: string): string {
  return liqpaySignWith("sha1", dataBase64, privateKey);
}

function signaturesMatch(received: string, expected: string): boolean {
  try {
    const a = Buffer.from(received);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/** Accept SHA1 (checkout) or SHA3-256 (newer callbacks) signatures. */
export function liqpayVerify(
  dataBase64: string,
  signature: string,
  privateKey: string,
): boolean {
  const sha1 = liqpaySignWith("sha1", dataBase64, privateKey);
  if (signaturesMatch(signature, sha1)) return true;
  const sha3 = liqpaySignWith("sha3-256", dataBase64, privateKey);
  return signaturesMatch(signature, sha3);
}

export function decodeLiqPayData<T = Record<string, unknown>>(dataBase64: string): T {
  const json = Buffer.from(dataBase64, "base64").toString("utf8");
  return JSON.parse(json) as T;
}

export function getLiqPayCheckoutUrl() {
  return `${LIQPAY_HOST}3/checkout`;
}

/** POST signed payload to LiqPay and return the hosted checkout URL (302 Location). */
export async function liqpayCreateCheckoutRedirect(
  data: string,
  signature: string,
): Promise<{ redirectUrl: string } | { error: string; status: number }> {
  const body = new URLSearchParams({ data, signature });
  const res = await fetch(getLiqPayCheckoutUrl(), {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    redirect: "manual",
  });

  const location = res.headers.get("location");
  if (res.status === 302 && location) {
    return { redirectUrl: location };
  }

  const detail = await res.text().catch(() => "");
  return {
    error: detail.slice(0, 200) || `LiqPay HTTP ${res.status}`,
    status: res.status,
  };
}
