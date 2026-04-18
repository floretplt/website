import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { orderCreateSchema } from "@/lib/validators";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { sendTelegramMessage } from "@/lib/telegram";
import { mergeDeliveryAddressParts } from "@/lib/delivery-address";
import { normalizeUaPhone } from "@/lib/phone";
import type { ProductRow } from "@/lib/types/database";
import type { Locale } from "@/i18n/routing";
import {
  kyivCalendarDateString,
  kyivMinutesSinceMidnight,
  parseClockToMinutes,
} from "@/lib/delivery-kyiv";
import {
  offeredSizes,
  productMinPrice,
  productPriceForSize,
} from "@/lib/product-display";

function isTooLateForSameDayKyiv(
  deliveryDate: string,
  cutoffClock: string,
): boolean {
  const today = kyivCalendarDateString();
  if (deliveryDate !== today) return false;
  return kyivMinutesSinceMidnight() > parseClockToMinutes(cutoffClock);
}

/** Form JSON may send "" for unused delivery fields — Zod optional/nullable needs null. */
function coerceOrderEmptyStrings(input: Record<string, unknown>) {
  const keys = [
    "delivery_date",
    "delivery_time",
    "delivery_address",
    "delivery_floor",
    "delivery_apartment",
    "recipient_phone",
  ] as const;
  for (const k of keys) {
    if (input[k] === "") input[k] = null;
  }
}

export async function POST(req: Request) {
  const ip = getClientIp(req.headers);
  if (!rateLimit(ip)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (body && typeof body === "object" && !Array.isArray(body)) {
    coerceOrderEmptyStrings(body as Record<string, unknown>);
  }

  const parsed = orderCreateSchema.safeParse(body);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const messageKey =
      typeof issue?.message === "string" ? issue.message : undefined;
    return NextResponse.json(
      {
        error: "Validation failed",
        messageKey,
        details: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const data = parsed.data;

  const mergedAddress =
    data.delivery_type === "delivery"
      ? mergeDeliveryAddressParts(
          data.delivery_address,
          data.delivery_floor,
          data.delivery_apartment,
        )
      : null;

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return NextResponse.json(
      { error: "SERVER_CONFIG" },
      { status: 503 },
    );
  }

  try {
    const { data: stRow, error: settingsErr } = await admin
      .from("site_settings")
      .select("same_day_cutoff_time")
      .limit(1)
      .maybeSingle();
    if (settingsErr) {
      console.warn("site_settings:", settingsErr.message);
    }
    const orderCutoff = String(stRow?.same_day_cutoff_time ?? "18:10:00");

    if (
      data.delivery_type === "delivery" &&
      data.delivery_date &&
      isTooLateForSameDayKyiv(data.delivery_date, orderCutoff)
    ) {
      return NextResponse.json(
        { error: "SAME_DAY_ORDER_CLOSED" },
        { status: 400 },
      );
    }

    const locale: Locale = data.currency === "UAH" ? "uk" : "en";

    if (data.product_id) {
      const { data: prod, error: prodErr } = await admin
        .from("products")
        .select(
          "id, price_uah_small, price_uah_medium, price_uah_large, price_eur_small, price_eur_medium, price_eur_large",
        )
        .eq("id", data.product_id)
        .maybeSingle();
      if (prodErr || !prod) {
        return NextResponse.json(
          { error: "INVALID_PRODUCT" },
          { status: 400 },
        );
      }
      const p = prod as ProductRow;
      const sizes = offeredSizes(p, locale);
      if (!sizes.includes(data.product_size)) {
        return NextResponse.json({ error: "INVALID_SIZE" }, { status: 400 });
      }
      const minPaid = productMinPrice(p, locale);
      const tierPrice = productPriceForSize(p, locale, data.product_size);
      if (tierPrice == null) {
        return NextResponse.json({ error: "INVALID_SIZE" }, { status: 400 });
      }
      if (data.price_paid + 1e-6 < minPaid) {
        return NextResponse.json({ error: "PRICE_TOO_LOW" }, { status: 400 });
      }
    }

    const { data: row, error } = await admin
      .from("orders")
      .insert({
        product_id: data.product_id,
        product_name: data.product_name,
        price_paid: data.price_paid,
        currency: data.currency,
        customer_name: data.customer_name,
        customer_phone: data.customer_phone,
        customer_email: null,
        delivery_type: data.delivery_type,
        delivery_date: data.delivery_date ?? null,
        delivery_time: data.delivery_time ?? null,
        delivery_address: mergedAddress,
        recipient_phone:
          data.delivery_type === "delivery" && data.recipient_phone
            ? normalizeUaPhone(data.recipient_phone)
            : null,
        gift_message: data.gift_message ?? null,
        notes: data.notes ?? null,
        product_size: data.product_size,
        payment_method: data.payment_method,
        status: "new",
        paid: false,
      })
      .select("id, order_number")
      .single();

    if (error || !row) {
      console.error("orders.insert", error);
      const hint =
        process.env.NODE_ENV !== "production" && error?.message
          ? error.message
          : undefined;
      return NextResponse.json(
        {
          error: "DATABASE_ERROR",
          ...(hint ? { hint } : {}),
        },
        { status: 500 },
      );
    }

    const msg = [
      `<b>Нове замовлення #${row.order_number}</b>`,
      data.payment_method === "reserve" ? "(бронь)" : "(передоплата)",
      `Товар: ${data.product_name}`,
      `Розмір: ${data.product_size}`,
      `Сума: ${data.price_paid} ${data.currency}`,
      `Клієнт: ${data.customer_name} ${data.customer_phone}`,
      `Доставка: ${data.delivery_type}`,
      data.delivery_type === "delivery"
        ? `Дата: ${data.delivery_date} ${data.delivery_time}\nАдреса: ${mergedAddress}\nТел. отримувача: ${data.recipient_phone}`
        : "Самовивіз",
      data.notes ? `Нотатки: ${data.notes}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    await sendTelegramMessage(msg);

    return NextResponse.json({
      id: row.id,
      orderNumber: row.order_number,
    });
  } catch (e) {
    console.error(e);
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      {
        error: "SERVER_ERROR",
        ...(process.env.NODE_ENV !== "production" ? { hint: msg } : {}),
      },
      { status: 500 },
    );
  }
}
