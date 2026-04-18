import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { decodeLiqPayData, liqpayVerify } from "@/lib/liqpay";
import { sendTelegramMessage } from "@/lib/telegram";

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

  const payload = decodeLiqPayData<{
    order_id?: string;
    status?: string;
    transaction_id?: string;
  }>(data);

  const orderId = payload.order_id;
  if (!orderId) {
    return new NextResponse("no order", { status: 400 });
  }

  const success = payload.status === "success" || payload.status === "sandbox";

  try {
    const admin = createAdminClient();

    if (success) {
      const { data: order, error } = await admin
        .from("orders")
        .update({
          paid: true,
          liqpay_order_id: payload.transaction_id ?? null,
        })
        .eq("id", orderId)
        .select("order_number, product_name, customer_name, customer_phone")
        .single();

      if (!error && order) {
        await sendTelegramMessage(
          `<b>Оплачено #${order.order_number}</b>\n${order.product_name}\n${order.customer_name} ${order.customer_phone}`,
        );
      }
    }

    return new NextResponse("OK", { status: 200 });
  } catch (e) {
    console.error(e);
    return new NextResponse("error", { status: 500 });
  }
}
