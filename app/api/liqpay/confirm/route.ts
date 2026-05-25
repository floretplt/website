import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { liqpayVerify } from "@/lib/liqpay";
import {
  confirmLiqPayFromPayload,
  confirmLiqPayFromPendingCookie,
} from "@/lib/liqpay-confirm-pending";
import {
  FLORET_LIQPAY_COOKIE,
  parsePendingLiqPayCookie,
  type PendingLiqPayCookie,
} from "@/lib/liqpay-pending-cookie";
import {
  getOrderPaidStateByLiqPayOrderId,
  parseLiqPayPaymentPayload,
} from "@/lib/liqpay-process-payment";
import { getClientIp, rateLimitAsync } from "@/lib/rate-limit";

const bodySchema = z.object({
  orderId: z.string().uuid().optional(),
  orderNumber: z.number().int().positive().optional(),
  liqpayOrderId: z.string().min(8).optional(),
  data: z.string().min(1).optional(),
  signature: z.string().min(1).optional(),
});

function resolvePending(
  fromBody: PendingLiqPayCookie | null,
): PendingLiqPayCookie | null {
  if (fromBody) return fromBody;
  return parsePendingLiqPayCookie(cookies().get(FLORET_LIQPAY_COOKIE)?.value);
}

export async function POST(req: Request) {
  const ip = getClientIp(req.headers);
  if (!(await rateLimitAsync(ip))) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let fromBody: PendingLiqPayCookie | null = null;
  let returnData: string | undefined;
  let returnSignature: string | undefined;

  try {
    const raw = await req.json();
    const parsed = bodySchema.safeParse(raw);
    if (parsed.success) {
      const d = parsed.data;
      if (d.orderId && d.orderNumber && d.liqpayOrderId) {
        fromBody = {
          orderId: d.orderId,
          orderNumber: d.orderNumber,
          liqpayOrderId: d.liqpayOrderId,
          ts: Date.now(),
        };
      }
      if (d.data && d.signature) {
        returnData = d.data;
        returnSignature = d.signature;
      }
    }
  } catch {
    /* empty body → cookie only */
  }

  const priv = process.env.LIQPAY_PRIVATE_KEY;

  if (returnData && returnSignature && priv && liqpayVerify(returnData, returnSignature, priv)) {
    try {
      const payload = parseLiqPayPaymentPayload(returnData);
      const dbState = await getOrderPaidStateByLiqPayOrderId(payload.order_id);
      if (dbState.paid && dbState.orderNumber != null) {
        const res = NextResponse.json({
          paid: true,
          orderNumber: dbState.orderNumber,
          status: payload.status,
        });
        res.cookies.set(FLORET_LIQPAY_COOKIE, "", { path: "/", maxAge: 0 });
        return res;
      }

      const result = await confirmLiqPayFromPayload(payload, {
        notifyTelegram: true,
      });
      const res = NextResponse.json({
        paid: result.paid,
        orderNumber: result.orderNumber,
        status: result.status,
      });
      if (result.paid) {
        res.cookies.set(FLORET_LIQPAY_COOKIE, "", { path: "/", maxAge: 0 });
      }
      return res;
    } catch (e) {
      console.error("liqpay confirm return payload", e);
    }
  }

  const pending = resolvePending(fromBody);
  if (!pending) {
    return NextResponse.json({ paid: false, error: "no_pending" }, { status: 404 });
  }

  try {
    const dbState = await getOrderPaidStateByLiqPayOrderId(pending.liqpayOrderId);
    if (dbState.paid && dbState.orderNumber != null) {
      const res = NextResponse.json({
        paid: true,
        orderNumber: dbState.orderNumber,
      });
      res.cookies.set(FLORET_LIQPAY_COOKIE, "", { path: "/", maxAge: 0 });
      return res;
    }

    const result = await confirmLiqPayFromPendingCookie(pending);

    const res = NextResponse.json({
      paid: result.paid,
      orderNumber: result.orderNumber,
      status: result.status,
    });
    if (result.paid) {
      res.cookies.set(FLORET_LIQPAY_COOKIE, "", { path: "/", maxAge: 0 });
    }
    return res;
  } catch (e) {
    console.error(e);
    return NextResponse.json({ paid: false, error: "confirm_failed" }, { status: 500 });
  }
}
