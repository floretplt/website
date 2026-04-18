import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { getLiqPayCheckoutUrl, liqpayEncode, liqpaySign } from "@/lib/liqpay";

const schema = z.object({
  orderId: z.string().uuid(),
});

export async function POST(req: Request) {
  const pub = process.env.NEXT_PUBLIC_LIQPAY_PUBLIC_KEY;
  const priv = process.env.LIQPAY_PRIVATE_KEY;
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  if (!pub || !priv) {
    return NextResponse.json({ error: "LiqPay not configured" }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  try {
    const admin = createAdminClient();
    const { data: order, error } = await admin
      .from("orders")
      .select("*")
      .eq("id", parsed.data.orderId)
      .single();

    if (error || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.paid) {
      return NextResponse.json({ error: "Already paid" }, { status: 400 });
    }

    if (order.payment_method !== "prepay") {
      return NextResponse.json({ error: "Wrong payment method" }, { status: 400 });
    }

    const amount = Number(order.price_paid);
    const currency = order.currency === "EUR" ? "EUR" : "UAH";

    const dataObj = {
      public_key: pub,
      version: "3",
      action: "pay",
      amount: amount.toFixed(2),
      currency,
      description: `Floret #${order.order_number}`,
      order_id: order.id,
      result_url: `${site}/order/liqpay/result`,
      server_url: `${site}/api/liqpay/callback`,
    };

    const data = liqpayEncode(dataObj);
    const signature = liqpaySign(data, priv);

    return NextResponse.json({
      data,
      signature,
      checkoutUrl: getLiqPayCheckoutUrl(),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
