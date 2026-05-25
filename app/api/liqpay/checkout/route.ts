import { NextResponse } from "next/server";
import { z } from "zod";
import { getUser, isAllowedAdminEmail } from "@/lib/auth";
import { buildLiqPayCheckoutForOrder } from "@/lib/liqpay-build-order-checkout";
import { notifyPrepayCheckoutStarted } from "@/lib/order-telegram-prepay-stages";
import { getClientIp, rateLimitAsync } from "@/lib/rate-limit";

const schema = z.object({
  orderId: z.string().uuid(),
  /** Admin: shareable hosted checkout URL. */
  returnLink: z.boolean().optional(),
});

export async function POST(req: Request) {
  const ip = getClientIp(req.headers);
  if (!(await rateLimitAsync(ip))) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
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
    const { orderId, returnLink } = parsed.data;

    if (returnLink) {
      const user = await getUser();
      if (!user || !isAllowedAdminEmail(user.email ?? undefined)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const result = await buildLiqPayCheckoutForOrder(orderId, { returnLink });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    if ("redirectUrl" in result) {
      return NextResponse.json({ redirectUrl: result.redirectUrl });
    }

    try {
      await notifyPrepayCheckoutStarted(
        orderId,
        result.amount,
        result.currency,
      );
    } catch (e) {
      console.error("telegram prepay checkout", e);
    }

    return NextResponse.json({
      data: result.data,
      signature: result.signature,
      checkoutUrl: result.checkoutUrl,
      orderNumber: result.orderNumber,
      liqpayOrderId: result.liqpayOrderId,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
