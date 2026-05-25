import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { orderCreateSchema } from "@/lib/validators";
import { getClientIp, rateLimitAsync } from "@/lib/rate-limit";
import { sendTelegramOrderCreated } from "@/lib/telegram";
import { buildNewOrderTelegramCaptionUk } from "@/lib/order-telegram-caption";
import { publicAssetAbsoluteUrl } from "@/lib/public-asset-url";
import {
  primaryProductImageUrl,
  resolvePublicProductImageUrl,
} from "@/lib/product-image";
import { telegramOrderInlineKeyboard } from "@/lib/telegram-order-keyboard";
import {
  DELIVERY_ADDRESS_PENDING_WITH_RECIPIENT_UK,
  mergeDeliveryAddressParts,
} from "@/lib/delivery-address";
import { normalizeUaPhone } from "@/lib/phone";
import type { ProductRow } from "@/lib/types/database";
import {
  addCalendarDaysYYYYMMDD,
  kyivCalendarDateString,
  kyivMinutesSinceMidnight,
  parseClockToMinutes,
} from "@/lib/delivery-kyiv";
import {
  bandDeliveryFeeUah,
  districtDeliveryFeeUah,
  namedZoneDeliveryFeeUah,
  parseDeliveryPricingConfig,
} from "@/lib/delivery-pricing";
import { getEffectiveNamedZones } from "@/lib/default-delivery-zones";
import { POSTCARD_FEE_UAH } from "@/lib/constants";
import {
  offeredSizes,
  productPriceForSize,
  productSmallTierFloorPrice,
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
    "delivery_district_id",
    "delivery_zone_id",
    "gift_message",
  ] as const;
  for (const k of keys) {
    if (input[k] === "") input[k] = null;
  }
  if (input["coordinate_address_with_recipient"] === undefined) {
    input["coordinate_address_with_recipient"] = false;
  }
}

function isPickupDateInWeekWindow(ymd: string): boolean {
  const today = kyivCalendarDateString();
  const last = addCalendarDaysYYYYMMDD(today, 6);
  return ymd >= today && ymd <= last;
}

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
  const coordinate = data.coordinate_address_with_recipient === true;
  const mergedAddress =
    data.delivery_type === "delivery"
      ? coordinate
        ? DELIVERY_ADDRESS_PENDING_WITH_RECIPIENT_UK
        : mergeDeliveryAddressParts(
            data.delivery_address,
            data.delivery_floor,
            data.delivery_apartment,
            data.delivery_entrance,
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
      .select("same_day_cutoff_time, delivery_pricing")
      .limit(1)
      .maybeSingle();
    if (settingsErr) {
      console.warn("site_settings:", settingsErr.message);
    }
    const orderCutoff = String(stRow?.same_day_cutoff_time ?? "18:10:00");
    const deliveryPricing = parseDeliveryPricingConfig(
      stRow?.delivery_pricing ?? {},
    );

    if (
      data.delivery_type === "pickup" &&
      data.delivery_date &&
      !isPickupDateInWeekWindow(data.delivery_date)
    ) {
      return NextResponse.json(
        { error: "PICKUP_DATE_INVALID" },
        { status: 400 },
      );
    }

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

    const districts = deliveryPricing.districts ?? [];
    const bands = deliveryPricing.bands ?? [];
    const namedZones = getEffectiveNamedZones(deliveryPricing);
    const useNamedZones =
      data.delivery_type === "delivery" &&
      data.currency === "UAH" &&
      !coordinate &&
      namedZones.length > 0;
    const useDistrictMatrix =
      !useNamedZones &&
      data.delivery_type === "delivery" &&
      data.currency === "UAH" &&
      !coordinate &&
      districts.length > 0;
    const useBandTiers =
      !useNamedZones &&
      data.delivery_type === "delivery" &&
      data.currency === "UAH" &&
      !coordinate &&
      districts.length === 0 &&
      bands.length > 0;

    if (useNamedZones && !data.delivery_zone_id?.trim()) {
      return NextResponse.json(
        { error: "DELIVERY_ZONE_REQUIRED" },
        { status: 400 },
      );
    }

    if (useDistrictMatrix && !data.delivery_district_id?.trim()) {
      return NextResponse.json(
        { error: "DELIVERY_DISTRICT_REQUIRED" },
        { status: 400 },
      );
    }

    if (useBandTiers && data.delivery_band_max_km == null) {
      return NextResponse.json(
        { error: "DELIVERY_TIER_REQUIRED" },
        { status: 400 },
      );
    }

    let deliveryFeeUah: number | null = null;
    if (data.delivery_type === "delivery" && data.currency === "UAH") {
      if (coordinate) {
        deliveryFeeUah = null;
      } else if (useNamedZones) {
        const fee = namedZoneDeliveryFeeUah(namedZones, data.delivery_zone_id);
        if (fee == null) {
          return NextResponse.json(
            { error: "INVALID_DELIVERY_ZONE" },
            { status: 400 },
          );
        }
        deliveryFeeUah = fee;
      } else if (useDistrictMatrix) {
        const fee = districtDeliveryFeeUah(
          districts,
          data.delivery_district_id,
          data.delivery_time,
        );
        if (fee == null) {
          return NextResponse.json(
            { error: "INVALID_DELIVERY_DISTRICT" },
            { status: 400 },
          );
        }
        deliveryFeeUah = fee;
      } else if (useBandTiers) {
        const fee = bandDeliveryFeeUah(bands, data.delivery_band_max_km);
        if (fee == null) {
          return NextResponse.json(
            { error: "INVALID_DELIVERY_TIER" },
            { status: 400 },
          );
        }
        deliveryFeeUah = fee;
      }
    }

    const postcardFeeUah =
      data.currency === "UAH" && data.gift_message?.trim()
        ? POSTCARD_FEE_UAH
        : null;

    let productImageSnapshot: string | null = null;

    if (data.product_id) {
      const { data: prod, error: prodErr } = await admin
        .from("products")
        .select(
          "id, price_uah_small, price_uah_medium, price_uah_large, price_eur_small, price_eur_medium, price_eur_large, image_url, images",
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
      const rawPrimary = primaryProductImageUrl({
        image_url: p.image_url ?? null,
        images: p.images,
      });
      productImageSnapshot = resolvePublicProductImageUrl(rawPrimary);
      const sizes = offeredSizes(p);
      if (!sizes.includes(data.product_size)) {
        return NextResponse.json({ error: "INVALID_SIZE" }, { status: 400 });
      }
      const tierPrice = productPriceForSize(p, data.product_size);
      if (tierPrice == null) {
        return NextResponse.json({ error: "INVALID_SIZE" }, { status: 400 });
      }
      const smallFloor = productSmallTierFloorPrice(p);
      if (smallFloor == null) {
        return NextResponse.json({ error: "INVALID_SIZE" }, { status: 400 });
      }
      // Intentional: form lets the client pick an "agreed amount" >= the S
      // floor for the product (see `agreedAmountHint` in messages/uk.json).
      // We deliberately do NOT enforce price_paid >= tier price for the
      // selected size — the operator may agree a discount with the client.
      if (data.price_paid + 1e-6 < smallFloor) {
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
        delivery_fee_uah: deliveryFeeUah,
        postcard_fee_uah: postcardFeeUah,
        product_image_url: productImageSnapshot,
        prefer_messenger_contact: data.prefer_messenger_contact === true,
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

    const pc = postcardFeeUah ?? 0;
    const del = deliveryFeeUah ?? 0;
    const totalDue = Number(data.price_paid) + del + pc;

    try {
      const caption = buildNewOrderTelegramCaptionUk({
        data,
        orderNumber: row.order_number,
        mergedAddress: data.delivery_type === "delivery" ? mergedAddress : null,
        deliveryFeeUah,
        postcardFeeUah,
        totalDueUah: totalDue,
      });

      await sendTelegramOrderCreated({
        caption,
        photoUrl: publicAssetAbsoluteUrl(productImageSnapshot),
        replyMarkup: telegramOrderInlineKeyboard({
          order_number: row.order_number,
          status: "new",
          delivery_type: data.delivery_type,
        }),
      });
    } catch (e) {
      console.error("telegram order created", e);
    }

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
