import crypto from "crypto";

const LIQPAY_HOST = "https://www.liqpay.ua/api/";

export function liqpayEncode(data: object): string {
  const json = JSON.stringify(data);
  return Buffer.from(json).toString("base64");
}

export function liqpaySign(dataBase64: string, privateKey: string): string {
  return crypto
    .createHash("sha1")
    .update(privateKey + dataBase64 + privateKey)
    .digest("base64");
}

export function liqpayVerify(
  dataBase64: string,
  signature: string,
  privateKey: string,
): boolean {
  const expected = liqpaySign(dataBase64, privateKey);
  try {
    const a = Buffer.from(signature);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function decodeLiqPayData<T = Record<string, unknown>>(dataBase64: string): T {
  const json = Buffer.from(dataBase64, "base64").toString("utf8");
  return JSON.parse(json) as T;
}

export function getLiqPayCheckoutUrl() {
  return `${LIQPAY_HOST}3/checkout`;
}
