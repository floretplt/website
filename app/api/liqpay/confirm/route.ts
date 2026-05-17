import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { confirmLiqPayFromPendingCookie } from "@/lib/liqpay-confirm-pending";
import {
  FLORET_LIQPAY_COOKIE,
  parsePendingLiqPayCookie,
  type PendingLiqPayCookie,
} from "@/lib/liqpay-pending-cookie";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

const bodySchema = z.object({
  orderId: z.string().uuid(),
  orderNumber: z.number().int().positive(),
  liqpayOrderId: z.string().min(8),
});

function resolvePending(
  fromBody: PendingLiqPayCookie | null,
): PendingLiqPayCookie | null {
  if (fromBody) return fromBody;
  return parsePendingLiqPayCookie(cookies().get(FLORET_LIQPAY_COOKIE)?.value);
}

export async function POST(req: Request) {
  const ip = getClientIp(req.headers);
  if (!rateLimit(ip)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let fromBody: PendingLiqPayCookie | null = null;
  try {
    const raw = await req.json();
    const parsed = bodySchema.safeParse(raw);
    if (parsed.success) {
      fromBody = { ...parsed.data, ts: Date.now() };
    }
  } catch {
    /* empty body → cookie only */
  }

  const pending = resolvePending(fromBody);
  if (!pending) {
    return NextResponse.json({ paid: false, error: "no_pending" }, { status: 404 });
  }

  try {
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
