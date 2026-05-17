import { NextResponse } from "next/server";
import { liqpayVerify } from "@/lib/liqpay";
import {
  liqpayPaymentNotifyTelegram,
  parseLiqPayPaymentPayload,
  processLiqPayPayment,
} from "@/lib/liqpay-process-payment";

export async function POST(req: Request) {
  const priv = process.env.LIQPAY_PRIVATE_KEY;
  if (!priv) {
    return new NextResponse("no key", { status: 503 });
  }

  const form = await req.formData();
  const data = form.get("data");
  const signature = form.get("signature");

  if (typeof data !== "string" || typeof signature !== "string") {
    return new NextResponse("bad request", { status: 400 });
  }

  if (!liqpayVerify(data, signature, priv)) {
    return new NextResponse("invalid signature", { status: 400 });
  }

  let payload;
  try {
    payload = parseLiqPayPaymentPayload(data);
  } catch {
    return new NextResponse("invalid payload", { status: 400 });
  }

  if (!payload.order_id) {
    return new NextResponse("no order", { status: 400 });
  }

  try {
    await processLiqPayPayment(payload, {
      notifyTelegram: liqpayPaymentNotifyTelegram(payload.status),
    });
    return new NextResponse("OK", { status: 200 });
  } catch (e) {
    console.error(e);
    return new NextResponse("error", { status: 500 });
  }
}
