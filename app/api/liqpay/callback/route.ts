import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { decodeLiqPayData, liqpayVerify } from "@/lib/liqpay";
import { buildPrepayConfirmedTelegramCaptionUk } from "@/lib/order-telegram-caption";
import { publicAssetAbsoluteUrl } from "@/lib/public-asset-url";
import { resolvePublicProductImageUrl } from "@/lib/product-image";
import { sendTelegramOrderCreated } from "@/lib/telegram";
import { telegramOrderInlineKeyboard } from "@/lib/telegram-order-keyboard";

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

  let payload: {
    order_id?: string;
    status?: string;
    transaction_id?: string;
    amount?: string | number;
  };
  try {
    payload = decodeLiqPayData<{
      order_id?: string;
      status?: string;
      transaction_id?: string;
      amount?: string | number;
    }>(data);
  } catch {
    return new NextResponse("invalid payload", { status: 400 });
  }

  const orderId = payload.order_id;
  if (!orderId) {
    return new NextResponse("no order", { status: 400 });
  }

  /** Mark order paid in DB for successful sandbox/live charges. */
  const markPaid =
    payload.status === "success" || payload.status === "sandbox";

  /** Staff Telegram only for confirmed live payments (not sandbox). */
  const notifyTelegram = payload.status === "success";

  try {
    const admin = createAdminClient();

    if (markPaid) {
      const { data: order, error } = await admin
        .from("orders")
        .update({
          paid: true,
          liqpay_order_id: payload.transaction_id ?? null,
        })
        .eq("id", orderId)
        .eq("paid", false)
        .select(
          [
            "order_number",
            "product_name",
            "product_size",
            "price_paid",
            "currency",
            "customer_name",
            "customer_phone",
            "delivery_type",
            "delivery_date",
            "delivery_time",
            "delivery_address",
            "recipient_phone",
            "gift_message",
            "notes",
            "delivery_fee_uah",
            "postcard_fee_uah",
            "prefer_messenger_contact",
            "product_image_url",
            "payment_method",
          ].join(", "),
        )
        .maybeSingle();

      if (!error && order && notifyTelegram) {
        const o = order as unknown as {
          order_number: number;
          product_name: string;
          product_size: string | null;
          price_paid: number;
          currency: string;
          customer_name: string;
          customer_phone: string;
          delivery_type: "pickup" | "delivery";
          delivery_date: string | null;
          delivery_time: string | null;
          delivery_address: string | null;
          recipient_phone: string | null;
          gift_message: string | null;
          notes: string | null;
          delivery_fee_uah: number | null;
          postcard_fee_uah: number | null;
          prefer_messenger_contact: boolean;
          product_image_url: string | null;
          payment_method: string;
        };

        if (o.payment_method === "prepay") {
          const bouquet = Number(o.price_paid);
          const fee =
            o.currency === "UAH" && o.delivery_fee_uah != null
              ? Number(o.delivery_fee_uah)
              : 0;
          const pc =
            o.currency === "UAH" && o.postcard_fee_uah != null
              ? Number(o.postcard_fee_uah)
              : 0;
          const totalPaid = bouquet + fee + pc;

          const caption = buildPrepayConfirmedTelegramCaptionUk({
            orderNumber: o.order_number,
            productName: o.product_name,
            productSize: o.product_size,
            pricePaid: bouquet,
            currency: o.currency,
            customerName: o.customer_name,
            customerPhone: o.customer_phone,
            deliveryType: o.delivery_type,
            deliveryDate: o.delivery_date,
            deliveryTime: o.delivery_time,
            deliveryAddress: o.delivery_address,
            recipientPhone: o.recipient_phone,
            giftMessage: o.gift_message,
            notes: o.notes,
            deliveryFeeUah:
              o.currency === "UAH" ? o.delivery_fee_uah : null,
            postcardFeeUah:
              o.currency === "UAH" ? o.postcard_fee_uah : null,
            preferMessengerContact: o.prefer_messenger_contact === true,
            totalPaid,
            liqpayTransactionId: payload.transaction_id ?? null,
          });

          const photoUrl = publicAssetAbsoluteUrl(
            resolvePublicProductImageUrl(o.product_image_url),
          );

          await sendTelegramOrderCreated({
            caption,
            photoUrl,
            replyMarkup: telegramOrderInlineKeyboard({
              order_number: o.order_number,
              status: "new",
              delivery_type: o.delivery_type,
            }),
          });
        }
      }
    }

    return new NextResponse("OK", { status: 200 });
  } catch (e) {
    console.error(e);
    return new NextResponse("error", { status: 500 });
  }
}
