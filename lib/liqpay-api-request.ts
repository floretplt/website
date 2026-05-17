import { decodeLiqPayData, liqpayEncode, liqpaySign } from "@/lib/liqpay";

const LIQPAY_REQUEST_URL = "https://www.liqpay.ua/api/request";

export async function liqpayApiRequest(
  action: string,
  params: Record<string, string | number>,
): Promise<Record<string, unknown>> {
  const pub = process.env.NEXT_PUBLIC_LIQPAY_PUBLIC_KEY;
  const priv = process.env.LIQPAY_PRIVATE_KEY;
  if (!pub || !priv) {
    throw new Error("LiqPay not configured");
  }

  const dataObj = {
    public_key: pub,
    version: 3,
    action,
    ...params,
  };
  const data = liqpayEncode(dataObj);
  const signature = liqpaySign(data, priv);
  const body = new URLSearchParams({ data, signature });

  const res = await fetch(LIQPAY_REQUEST_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });

  const json = (await res.json()) as { data?: string; err_description?: string };
  if (typeof json.data === "string") {
    return decodeLiqPayData<Record<string, unknown>>(json.data);
  }
  if (json.err_description) {
    throw new Error(String(json.err_description).slice(0, 200));
  }
  return json as Record<string, unknown>;
}
