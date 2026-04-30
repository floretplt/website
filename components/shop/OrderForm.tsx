"use client";

import { Link, useRouter } from "@/i18n/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Controller, useForm, type Resolver } from "react-hook-form";
import { useEffect, useMemo, useState } from "react";
import type {
  DeliveryDistrictRow,
  DeliveryNamedZoneRow,
  DeliveryPricingBand,
  ProductRow,
} from "@/lib/types/database";
import type { Size } from "@/lib/constants";
import {
  orderCreateSchema,
  type OrderCreateInput,
} from "@/lib/validators";
import {
  offeredSizes,
  primaryImage,
  productCurrency,
  productMinPrice,
  productName,
  productPriceForSize,
  productSmallTierFloorPrice,
} from "@/lib/product-display";
import { ProductImageLightbox } from "@/components/shop/ProductImageLightbox";
import { formatMoney } from "@/lib/format";
import { AddressAutocomplete } from "@/components/shop/AddressAutocomplete";
import { normalizeUaPhone } from "@/lib/phone";
import { POSTCARD_FEE_UAH } from "@/lib/constants";
import { addCalendarDaysYYYYMMDD } from "@/lib/delivery-kyiv";
import {
  bandDeliveryFeeUah,
  districtDeliveryFeeUah,
  namedZoneDeliveryFeeUah,
} from "@/lib/delivery-pricing";
import { pickupTimeSlotValues } from "@/lib/pickup-slots";
import { Check } from "lucide-react";

type Props = {
  initialProduct: ProductRow | null;
  /** From `?size=` when present (small | medium | large). */
  defaultProductSize?: Size;
  /** YYYY-MM-DD — earliest delivery date (Kyiv, same-day order cutoff). */
  minDeliveryDate: string;
  /** YYYY-MM-DD — first day offered for pickup (usually today in Kyiv). */
  minPickupDate: string;
  sameDayOrderCutoff?: string;
  sameDayDeliveryEnd?: string;
  /** Distance tiers from site settings — shown when delivery is selected. */
  deliveryBands?: DeliveryPricingBand[];
  /** Optional district × time matrix (UAH) from site settings. */
  deliveryDistricts?: DeliveryDistrictRow[];
  /** Named zones (admin or built-in Poltava defaults). */
  namedZones: DeliveryNamedZoneRow[];
};

const mapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

const VALIDATION_CODES = [
  "nameRequired",
  "phoneUa",
  "privacyRequired",
  "deliveryDateRequired",
  "deliveryTimeRequired",
  "pickupDateRequired",
  "pickupTimeRequired",
  "deliveryAddressRequired",
  "recipientPhoneRequired",
  "recipientPhoneInvalid",
] as const;

const API_MESSAGE_KEYS = new Set([...VALIDATION_CODES]);

function FieldError({ messageKey }: { messageKey: string | undefined }) {
  const t = useTranslations("order.validation");
  if (!messageKey) return null;
  if (!VALIDATION_CODES.includes(messageKey as (typeof VALIDATION_CODES)[number])) {
    return <p className="text-base text-red-800 md:text-sm">{messageKey}</p>;
  }
  return (
    <p className="text-base text-red-800 md:text-sm">
      {t(messageKey as (typeof VALIDATION_CODES)[number])}
    </p>
  );
}

export function OrderForm({
  initialProduct,
  defaultProductSize,
  minDeliveryDate,
  minPickupDate,
  sameDayOrderCutoff,
  sameDayDeliveryEnd,
  deliveryBands = [],
  deliveryDistricts = [],
  namedZones,
}: Props) {
  const t = useTranslations("order");
  const ts = useTranslations("sizes");
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const currency = productCurrency();
  const pickupSlots = useMemo(() => pickupTimeSlotValues(), []);
  const hasDistrictMatrix = deliveryDistricts.length > 0;
  const maxPickupDate = useMemo(
    () => addCalendarDaysYYYYMMDD(minPickupDate, 6),
    [minPickupDate],
  );
  const { resolvedDefaultSize, catalogMinPrice, defaultPriceForSize, defaultName } =
    useMemo(() => {
      if (!initialProduct) {
        return {
          resolvedDefaultSize: "medium" as Size,
          catalogMinPrice: 0,
          defaultPriceForSize: 0,
          defaultName: "",
        };
      }
      const offered = offeredSizes(initialProduct);
      const rs: Size =
        defaultProductSize && offered.includes(defaultProductSize)
          ? defaultProductSize
          : (offered[0] ?? "medium");
      const minP = productMinPrice(initialProduct);
      const tier = productPriceForSize(initialProduct, rs);
      return {
        resolvedDefaultSize: rs,
        catalogMinPrice: minP,
        defaultPriceForSize: tier ?? minP,
        defaultName: productName(initialProduct),
      };
    }, [initialProduct, defaultProductSize]);

  const previewSrc = useMemo(
    () => (initialProduct ? primaryImage(initialProduct) : null),
    [initialProduct],
  );

  const defaultValues = useMemo(
    () =>
      ({
        product_id: initialProduct?.id ?? null,
        product_name: defaultName,
        price_paid: initialProduct
          ? Math.max(defaultPriceForSize || 1, catalogMinPrice || 0.01)
          : 1,
        currency,
        product_size: resolvedDefaultSize,
        customer_name: "",
        customer_phone: "",
        delivery_type: "pickup" as const,
        delivery_date: minPickupDate,
        delivery_time: pickupSlots[0] ?? null,
        delivery_address: null,
        delivery_entrance: null,
        delivery_floor: null,
        delivery_apartment: null,
        recipient_phone: null,
        gift_message: null,
        notes: null,
        payment_method: "reserve" as const,
        prefer_messenger_contact: false,
        privacy_accepted: false,
        coordinate_address_with_recipient: false,
        delivery_district_id: null,
        delivery_band_max_km: null,
        delivery_zone_id: null,
      }) as Partial<OrderCreateInput>,
    [
      initialProduct,
      defaultName,
      defaultPriceForSize,
      catalogMinPrice,
      currency,
      resolvedDefaultSize,
      minPickupDate,
      pickupSlots,
    ],
  );

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    getValues,
    trigger,
    formState: { errors },
  } = useForm<OrderCreateInput>({
    resolver: zodResolver(orderCreateSchema) as Resolver<OrderCreateInput>,
    defaultValues: defaultValues as OrderCreateInput,
    mode: "onBlur",
    reValidateMode: "onChange",
  });

  const deliveryType = watch("delivery_type");
  const paymentMethod = watch("payment_method");
  const watchedSize = watch("product_size");
  const coordinate = watch("coordinate_address_with_recipient");
  const deliveryDistrictId = watch("delivery_district_id");
  const watchDeliveryTime = watch("delivery_time");
  const pricePaidWatch = watch("price_paid");
  const giftMessageWatch = watch("gift_message");
  const deliveryBandMaxKm = watch("delivery_band_max_km");
  const deliveryZoneId = watch("delivery_zone_id");

  useEffect(() => {
    if (coordinate) {
      setValue("delivery_address", "");
      setValue("delivery_entrance", "");
      setValue("delivery_floor", "");
      setValue("delivery_apartment", "");
      setValue("delivery_district_id", null);
      setValue("delivery_band_max_km", null);
      setValue("delivery_zone_id", null);
    }
  }, [coordinate, setValue]);

  const deliveryFeeUah = useMemo(() => {
    if (deliveryType !== "delivery" || coordinate || currency !== "UAH") {
      return null;
    }
    if (namedZones.length > 0) {
      return namedZoneDeliveryFeeUah(namedZones, deliveryZoneId);
    }
    if (hasDistrictMatrix) {
      return districtDeliveryFeeUah(
        deliveryDistricts,
        deliveryDistrictId,
        watchDeliveryTime,
      );
    }
    if (deliveryBands.length > 0) {
      return bandDeliveryFeeUah(deliveryBands, deliveryBandMaxKm);
    }
    return null;
  }, [
    coordinate,
    currency,
    deliveryBandMaxKm,
    deliveryBands,
    deliveryDistrictId,
    deliveryDistricts,
    deliveryType,
    deliveryZoneId,
    hasDistrictMatrix,
    namedZones,
    watchDeliveryTime,
  ]);

  const bouquetAmount = Number(pricePaidWatch);
  const postcardFeeUah =
    currency === "UAH" && (giftMessageWatch?.trim() ?? "") !== ""
      ? POSTCARD_FEE_UAH
      : 0;
  const needsDeliveryQuote =
    deliveryType === "delivery" &&
    currency === "UAH" &&
    !coordinate &&
    (namedZones.length > 0 || hasDistrictMatrix || deliveryBands.length > 0);
  const deliveryFeeKnown = !needsDeliveryQuote || coordinate || deliveryFeeUah != null;
  const deliveryChargeUah =
    deliveryType !== "delivery" || currency !== "UAH" || coordinate
      ? 0
      : (deliveryFeeUah ?? 0);
  const totalToCharge = bouquetAmount + deliveryChargeUah + postcardFeeUah;

  /** Lowest allowed sum: size S (or cheapest tier if S is not sold). */
  const smallTierMin = useMemo(() => {
    if (!initialProduct) return 0.01;
    const s = productSmallTierFloorPrice(initialProduct);
    if (s != null && s > 0) return s;
    return Math.max(catalogMinPrice || 0.01, 0.01);
  }, [initialProduct, catalogMinPrice]);

  useEffect(() => {
    if (!initialProduct) return;
    const current = getValues("price_paid");
    if (typeof current === "number" && current + 1e-9 < smallTierMin) {
      setValue("price_paid", smallTierMin, {
        shouldValidate: true,
        shouldDirty: true,
      });
    } else {
      void trigger("price_paid");
    }
  }, [initialProduct, watchedSize, smallTierMin, getValues, setValue, trigger]);

  const sizeOptions = initialProduct ? offeredSizes(initialProduct) : [];

  const showBandHintTable =
    deliveryType === "delivery" &&
    deliveryBands.length > 0 &&
    (deliveryDistricts.length > 0 || coordinate);

  const showBandTierCards =
    deliveryType === "delivery" &&
    currency === "UAH" &&
    deliveryBands.length > 0 &&
    namedZones.length === 0 &&
    !hasDistrictMatrix &&
    !coordinate;

  const onSubmit = async (values: OrderCreateInput) => {
    setFormError(null);
    if (initialProduct) {
      if (values.price_paid + 1e-9 < smallTierMin) {
        setFormError(
          t("priceBelowSmallMinimum", {
            min: formatMoney(smallTierMin, currency),
          }),
        );
        return;
      }
    }
    if (
      values.delivery_type === "delivery" &&
      values.currency === "UAH" &&
      !values.coordinate_address_with_recipient &&
      namedZones.length > 0 &&
      !values.delivery_zone_id?.trim()
    ) {
      setFormError(t("deliveryNamedZoneRequired"));
      return;
    }
    if (
      values.delivery_type === "delivery" &&
      values.currency === "UAH" &&
      !values.coordinate_address_with_recipient &&
      namedZones.length === 0 &&
      deliveryBands.length > 0 &&
      values.delivery_band_max_km == null
    ) {
      setFormError(t("deliveryTierRequired"));
      return;
    }
    if (
      values.delivery_type === "delivery" &&
      values.currency === "UAH" &&
      !values.coordinate_address_with_recipient &&
      hasDistrictMatrix &&
      !values.delivery_district_id?.trim()
    ) {
      setFormError(t("deliveryDistrictRequired"));
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          customer_phone: normalizeUaPhone(values.customer_phone),
          product_id: initialProduct?.id ?? null,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        error?: string;
        messageKey?: string;
        hint?: string;
        id?: string;
        orderNumber?: number;
      };
      if (!res.ok) {
        const code = typeof json.error === "string" ? json.error : "";
        const mk = json.messageKey;
        const devHint =
          process.env.NODE_ENV === "development" && json.hint
            ? ` (${json.hint})`
            : "";
        if (code === "PRICE_TOO_LOW") {
          setFormError(t("validation.priceTooLow"));
        } else if (code === "SAME_DAY_ORDER_CLOSED") {
          setFormError(t("sameDayOrderClosed"));
        } else if (code === "PICKUP_DATE_INVALID") {
          setFormError(t("pickupDateInvalid"));
        } else if (code === "DELIVERY_DISTRICT_REQUIRED") {
          setFormError(t("deliveryDistrictRequired"));
        } else if (code === "INVALID_DELIVERY_DISTRICT") {
          setFormError(t("invalidDeliveryDistrict"));
        } else if (code === "DELIVERY_TIER_REQUIRED") {
          setFormError(t("deliveryTierRequired"));
        } else if (code === "INVALID_DELIVERY_TIER") {
          setFormError(t("invalidDeliveryTier"));
        } else if (code === "DELIVERY_ZONE_REQUIRED") {
          setFormError(t("deliveryNamedZoneRequired"));
        } else if (code === "INVALID_DELIVERY_ZONE") {
          setFormError(t("invalidDeliveryNamedZone"));
        } else if (code === "SERVER_CONFIG") {
          setFormError(t("errorServerConfig"));
        } else if (code === "DATABASE_ERROR") {
          setFormError(t("errorDatabase") + devHint);
        } else if (code === "INVALID_PRODUCT") {
          setFormError(t("errorInvalidProduct"));
        } else if (code === "INVALID_SIZE") {
          setFormError(t("errorInvalidSize"));
        } else if (code === "Too many requests") {
          setFormError(t("errorTooMany"));
        } else if (
          code === "Validation failed" &&
          mk &&
          API_MESSAGE_KEYS.has(mk as (typeof VALIDATION_CODES)[number])
        ) {
          setFormError(
            t(`validation.${mk}` as "validation.phoneUa"),
          );
        } else if (code === "SERVER_ERROR" && devHint) {
          setFormError(t("error") + devHint);
        } else {
          setFormError(t("error"));
        }
        setLoading(false);
        return;
      }

      if (values.payment_method === "reserve") {
        const num = json.orderNumber;
        if (num != null) {
          router.push(`/order/${num}?thanks=1`);
        } else {
          setFormError(t("error"));
        }
        return;
      }

      const pay = await fetch("/api/liqpay/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: json.id }),
      });
      const payJson = await pay.json();
      if (!pay.ok || !payJson.data || !payJson.signature) {
        setFormError(t("error"));
        setLoading(false);
        return;
      }

      const formEl = document.createElement("form");
      formEl.method = "POST";
      formEl.action = payJson.checkoutUrl;
      const d = document.createElement("input");
      d.name = "data";
      d.value = payJson.data;
      const s = document.createElement("input");
      s.name = "signature";
      s.value = payJson.signature;
      formEl.appendChild(d);
      formEl.appendChild(s);
      document.body.appendChild(formEl);
      formEl.submit();
    } catch {
      setFormError(t("error"));
    } finally {
      setLoading(false);
    }
  };

  const req = t("requiredStar");
  const opt = t("optionalTag");

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="mx-auto max-w-xl space-y-8 px-4 py-10 sm:px-6 sm:py-12 md:px-0 md:py-16"
    >
      <h1 className="h-section">{t("title")}</h1>

      <section className="space-y-4 rounded-xl border border-ink/12 bg-bg/60 p-5 shadow-sm md:p-6">
        <h2 className="eyebrow">{t("product")}</h2>
        {previewSrc ? (
          <div className="max-w-[280px]">
            <ProductImageLightbox
              images={[previewSrc]}
              alt={defaultName}
              sizes="(max-width: 640px) 100vw, 320px"
              aspectClassName="aspect-[4/5] w-full"
            />
          </div>
        ) : null}
        {initialProduct ? (
          <>
            <p className="font-display text-2xl">{defaultName}</p>
            <p className="mt-2 text-base leading-relaxed text-muted md:text-sm">
              {sizeOptions.map((s, i) => {
                const pr = productPriceForSize(initialProduct, s);
                if (pr == null) return null;
                const label = s === "small" ? "S" : s === "medium" ? "M" : "L";
                return (
                  <span key={s}>
                    {i > 0 ? " · " : null}
                    {label} — {formatMoney(pr, currency)}
                  </span>
                );
              })}
            </p>
            <input type="hidden" {...register("product_name")} />
          </>
        ) : (
          <div className="space-y-3">
            <label className="block">
              <span className="form-label">
                {t("productNameManual")}
                {req}
              </span>
              <input className="form-input" {...register("product_name")} />
            </label>
            <FieldError messageKey={errors.product_name?.message} />
          </div>
        )}

        <div className="pt-2">
          <p className="form-label mb-3">
            {t("bouquetSize")}
            {req}
          </p>
          <Controller
            name="product_size"
            control={control}
            render={({ field }) => (
              <div className="flex flex-wrap gap-2">
                {(initialProduct ? sizeOptions : (["small", "medium", "large"] as const)).map((s) => (
                  <button
                    key={s}
                    type="button"
                    title={ts(s)}
                    onClick={() => {
                      field.onChange(s);
                      if (!initialProduct) return;
                      const tier = productPriceForSize(initialProduct, s);
                      const next =
                        tier != null && tier > 0 ? tier : smallTierMin;
                      setValue("price_paid", next, {
                        shouldValidate: true,
                        shouldDirty: true,
                      });
                    }}
                    className={`min-w-[3rem] border px-4 py-2 text-base font-medium uppercase tracking-wider md:text-sm ${
                      field.value === s
                        ? "border-ink bg-ink text-bg"
                        : "border-ink/20 text-muted hover:border-ink"
                    }`}
                  >
                    {s === "small" ? "S" : s === "medium" ? "M" : "L"}
                  </button>
                ))}
              </div>
            )}
          />
          <FieldError messageKey={errors.product_size?.message} />
        </div>

        <div className="pt-2">
          <label className="block min-w-0">
            <span className="form-label">
              {t("agreedAmount")}
              {req}
            </span>
            <input
              type="number"
              step="0.01"
              min={initialProduct ? smallTierMin : 0.01}
              className="form-input tabular-nums"
              {...register("price_paid", {
                valueAsNumber: true,
                validate: (v) => {
                  if (!initialProduct) return true;
                  if (typeof v !== "number" || !Number.isFinite(v)) return true;
                  if (v + 1e-9 < smallTierMin) {
                    return t("priceBelowSmallMinimum", {
                      min: formatMoney(smallTierMin, currency),
                    });
                  }
                  return true;
                },
              })}
            />
          </label>
          {initialProduct ? (
            <>
              <p className="mt-1 text-sm md:text-[11px] leading-relaxed text-muted">
                {t("agreedAmountHint")}
              </p>
              <p className="mt-1 text-sm md:text-[11px] leading-relaxed text-muted">
                {t("priceFloorHint", {
                  min: formatMoney(smallTierMin, currency),
                })}
              </p>
            </>
          ) : null}
          <FieldError messageKey={errors.price_paid?.message} />
          <input type="hidden" {...register("currency")} value={currency} />
        </div>
      </section>

      <section className="space-y-4 rounded-xl border border-ink/12 bg-bg/60 p-5 shadow-sm md:p-6">
        <h2 className="eyebrow">
          {t("notes")}
          {opt}
        </h2>
        <textarea
          rows={4}
          className="form-input min-h-[7.5rem] resize-y py-3"
          placeholder={t("notesPlaceholder")}
          {...register("notes")}
        />
      </section>

      <section className="space-y-4 rounded-xl border border-ink/12 bg-bg/60 p-5 shadow-sm md:p-6">
        <h2 className="eyebrow">{t("delivery")}</h2>
        <div className="flex flex-col gap-3 text-base sm:flex-row sm:items-center sm:gap-6 md:text-sm">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              value="pickup"
              {...register("delivery_type", {
                onChange: () => {
                  setValue("delivery_date", minPickupDate, {
                    shouldValidate: true,
                    shouldDirty: true,
                  });
                  setValue("delivery_time", pickupSlots[0] ?? null, {
                    shouldValidate: true,
                    shouldDirty: true,
                  });
                  setValue("delivery_address", null);
                  setValue("delivery_floor", null);
                  setValue("delivery_apartment", null);
                  setValue("recipient_phone", null);
                  setValue("coordinate_address_with_recipient", false);
                  setValue("delivery_district_id", null);
                  setValue("delivery_band_max_km", null);
                  setValue("delivery_zone_id", null);
                },
              })}
            />
            {t("pickup")}
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              value="delivery"
              {...register("delivery_type", {
                onChange: () => {
                  setValue("delivery_date", minDeliveryDate, {
                    shouldValidate: true,
                    shouldDirty: true,
                  });
                  setValue("delivery_time", null, {
                    shouldValidate: true,
                    shouldDirty: true,
                  });
                  setValue("delivery_address", null);
                  setValue("delivery_floor", null);
                  setValue("delivery_apartment", null);
                  setValue("recipient_phone", null);
                  setValue("coordinate_address_with_recipient", false);
                  setValue("delivery_district_id", null);
                  setValue("delivery_band_max_km", null);
                  setValue("delivery_zone_id", null);
                },
              })}
            />
            {t("deliveryOption")}
          </label>
        </div>

        {deliveryType === "pickup" ? (
          <div className="grid min-w-0 gap-4 md:grid-cols-2">
            <p className="text-base leading-relaxed text-muted md:col-span-2 md:text-sm">
              {t("pickupAddressHint")}
            </p>
            <div className="min-w-0 text-base text-muted md:text-sm">
              <label className="block min-w-0">
                <span className="form-label">
                  {t("pickupDate")}
                  {req}
                </span>
                <input
                  type="date"
                  min={minPickupDate}
                  max={maxPickupDate}
                  lang="uk"
                  className="form-input max-w-full"
                  {...register("delivery_date")}
                />
              </label>
              <p className="mt-1 text-sm md:text-[11px] text-muted">{t("pickupDateRangeHint")}</p>
              <FieldError messageKey={errors.delivery_date?.message} />
            </div>
            <div className="min-w-0 text-base text-muted md:text-sm">
              <label className="block min-w-0">
                <span className="form-label">
                  {t("pickupTime")}
                  {req}
                </span>
                <select className="form-input" {...register("delivery_time")}>
                  {pickupSlots.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
              </label>
              <p className="mt-1 text-sm md:text-[11px] leading-relaxed text-muted">
                {t("pickupTimeHint")}
              </p>
              <FieldError messageKey={errors.delivery_time?.message} />
            </div>
          </div>
        ) : null}

        {deliveryType === "delivery" ? (
          <div className="grid min-w-0 gap-4 md:grid-cols-2">
            {showBandHintTable ? (
              <div className="rounded-lg border border-ink/15 bg-ink/[0.02] p-4 md:col-span-2">
                <p className="form-label mb-0">{t("deliveryPricingTitle")}</p>
                <div className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
                  <table className="mt-3 w-full min-w-[16rem] max-w-md text-base md:text-sm">
                    <tbody>
                      {deliveryBands.map((b) => (
                        <tr
                          key={`${b.max_km}-${b.price_uah}`}
                          className="border-t border-ink/10 first:border-t-0"
                        >
                          <td className="py-2 pr-4 text-muted">
                            {t("deliveryPricingKm", { km: b.max_km })}
                          </td>
                          <td className="py-2 tabular-nums text-ink">
                            {formatMoney(b.price_uah, currency)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="mt-3 text-sm md:text-[11px] leading-relaxed text-muted">
                  {t("deliveryPricingNote")}
                </p>
              </div>
            ) : null}
            {showBandTierCards ? (
              <Controller
                name="delivery_band_max_km"
                control={control}
                render={({ field }) => (
                  <div className="md:col-span-2 space-y-3">
                    <p className="form-label mb-0">
                      {t("deliveryTierTitle")}
                      {req}
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {deliveryBands.map((b) => {
                        const selected = field.value === b.max_km;
                        return (
                          <button
                            key={`${b.max_km}-${b.price_uah}`}
                            type="button"
                            onClick={() =>
                              field.onChange(
                                selected ? null : b.max_km,
                              )
                            }
                            className={`flex flex-col gap-1 border px-4 py-3 text-left text-base transition-colors md:text-sm ${
                              selected
                                ? "border-ink bg-ink/[0.04] ring-1 ring-ink"
                                : "border-ink/20 hover:border-ink/50"
                            }`}
                          >
                            <span className="font-medium text-ink">
                              {t("deliveryPricingKm", { km: b.max_km })}
                            </span>
                            <span className="tabular-nums text-muted">
                              {formatMoney(b.price_uah, currency)}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-sm md:text-[11px] leading-relaxed text-muted">
                      {t("deliveryTierHint")}
                    </p>
                  </div>
                )}
              />
            ) : null}
            {currency === "UAH" && namedZones.length > 0 && !coordinate ? (
              <Controller
                name="delivery_zone_id"
                control={control}
                render={({ field }) => (
                  <div className="text-base text-muted md:col-span-2 md:text-sm space-y-3">
                    <p className="form-label mb-0">
                      {t("deliveryNamedZoneTitle")}
                      {req}
                    </p>
                    <div className="grid gap-3 sm:grid-cols-1">
                      {namedZones.map((z) => {
                        const selected = field.value === z.id;
                        const desc =
                          z.description_uk;
                        return (
                          <button
                            key={z.id}
                            type="button"
                            onClick={() => field.onChange(z.id)}
                            className={`relative flex w-full flex-col gap-1 border-2 px-4 py-3.5 pr-11 text-left transition-colors ${
                              selected
                                ? "border-ink bg-ink/[0.04] ring-1 ring-ink"
                                : "border-ink/20 hover:border-ink/45"
                            }`}
                          >
                            {selected ? (
                              <Check
                                className="absolute right-3 top-3 h-5 w-5 shrink-0 text-ink"
                                strokeWidth={2.25}
                                aria-hidden
                              />
                            ) : null}
                            <span className="pr-2 font-medium leading-snug text-ink">
                              {z.label_uk}
                            </span>
                            {desc ? (
                              <span className="pr-2 text-sm md:text-[11px] leading-relaxed text-muted">
                                {desc}
                              </span>
                            ) : null}
                            <span className="tabular-nums text-muted">
                              {formatMoney(z.price_uah, "UAH")}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-sm md:text-[11px] leading-relaxed text-muted">
                      {t("deliveryZoneCardsHint")}
                    </p>
                  </div>
                )}
              />
            ) : null}
            {currency === "UAH" && hasDistrictMatrix && !coordinate ? (
              <Controller
                name="delivery_district_id"
                control={control}
                render={({ field }) => (
                  <div className="text-base text-muted md:col-span-2 md:text-sm space-y-3">
                    <p className="form-label mb-0">
                      {t("deliveryDistrict")}
                      {req}
                    </p>
                    <div className="grid gap-3 sm:grid-cols-1">
                      {deliveryDistricts.map((d) => {
                        const selected = field.value === d.id;
                        const flat =
                          d.morning_uah === d.afternoon_uah &&
                          d.afternoon_uah === d.evening_uah;
                        const priceLabel = flat
                          ? formatMoney(d.morning_uah, "UAH")
                          : (() => {
                              const lo = Math.min(
                                d.morning_uah,
                                d.afternoon_uah,
                                d.evening_uah,
                              );
                              const hi = Math.max(
                                d.morning_uah,
                                d.afternoon_uah,
                                d.evening_uah,
                              );
                              if (lo === hi) {
                                return formatMoney(lo, "UAH");
                              }
                              const slot = districtDeliveryFeeUah(
                                [d],
                                d.id,
                                watchDeliveryTime,
                              );
                              return slot != null
                                ? formatMoney(slot, "UAH")
                                : `${formatMoney(lo, "UAH")}–${formatMoney(hi, "UAH")}`;
                            })();
                        return (
                          <button
                            key={d.id}
                            type="button"
                            onClick={() => field.onChange(d.id)}
                            className={`relative flex w-full flex-col gap-1 border-2 px-4 py-3.5 pr-11 text-left transition-colors ${
                              selected
                                ? "border-ink bg-ink/[0.04] ring-1 ring-ink"
                                : "border-ink/20 hover:border-ink/45"
                            }`}
                          >
                            {selected ? (
                              <Check
                                className="absolute right-3 top-3 h-5 w-5 shrink-0 text-ink"
                                strokeWidth={2.25}
                                aria-hidden
                              />
                            ) : null}
                            <span className="pr-2 font-medium leading-snug text-ink">
                              {d.label_uk}
                            </span>
                            <span className="tabular-nums text-muted">
                              {priceLabel}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-sm md:text-[11px] leading-relaxed text-muted">
                      {t("deliveryZoneCardsHint")}
                    </p>
                  </div>
                )}
              />
            ) : null}
            <div className="min-w-0 text-base text-muted md:text-sm">
              <label className="block min-w-0">
                <span className="form-label">
                  {t("deliveryDate")}
                  {req}
                </span>
                <input
                  type="date"
                  min={minDeliveryDate}
                  lang="uk"
                  className="form-input max-w-full"
                  {...register("delivery_date")}
                />
              </label>
              <p className="mt-1 text-sm md:text-[11px] text-muted">{t("dateFormatHint")}</p>
              {sameDayOrderCutoff && sameDayDeliveryEnd ? (
                <p className="mt-2 text-sm md:text-[11px] leading-relaxed text-muted">
                  {t("deliverySameDayRules", {
                    orderCutoff: sameDayOrderCutoff,
                    deliveryEnd: sameDayDeliveryEnd,
                  })}
                </p>
              ) : null}
              <FieldError messageKey={errors.delivery_date?.message} />
            </div>
            <div className="min-w-0 text-base text-muted md:text-sm">
              <label className="block min-w-0">
                <span className="form-label">
                  {t("deliveryTime")}
                  {req}
                </span>
                <select className="form-input" {...register("delivery_time")}>
                  <option value="">—</option>
                  <option value="morning">{t("timeMorning")}</option>
                  <option value="afternoon">{t("timeAfternoon")}</option>
                  <option value="evening">{t("timeEvening")}</option>
                </select>
              </label>
              <p className="mt-1 text-sm md:text-[11px] leading-relaxed text-muted">
                {t("deliveryTimeApproxHint")}
              </p>
              <FieldError messageKey={errors.delivery_time?.message} />
            </div>
            <label className="flex cursor-pointer items-start gap-3 text-base text-muted md:col-span-2 md:text-sm">
              <input
                type="checkbox"
                className="mt-1"
                {...register("coordinate_address_with_recipient")}
              />
              <span>
                <span className="block font-medium text-ink">
                  {t("coordinateAddressLabel")}
                </span>
                <span className="mt-1 block text-sm md:text-[11px] leading-relaxed">
                  {t("coordinateAddressHelp")}
                </span>
              </span>
            </label>
            {!coordinate && (
              <>
                <div className="min-w-0 md:col-span-2 md:text-sm">
                  <span className="form-label">
                    {t("address")}
                    {req}
                  </span>
                  <Controller
                    name="delivery_address"
                    control={control}
                    render={({ field }) => (
                      <AddressAutocomplete
                        name={field.name}
                        value={field.value ?? ""}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        apiKey={mapsKey}
                        className="form-input"
                        placeholder={t("addressPlaceholder")}
                        hint={
                          mapsKey
                            ? t("addressAutocompleteHint")
                            : undefined
                        }
                        fallbackHint={!mapsKey ? t("addressManualFallback") : undefined}
                      />
                    )}
                  />
                  <FieldError messageKey={errors.delivery_address?.message} />
                </div>
                <label className="min-w-0 md:col-span-2 md:text-sm">
                  <span className="form-label">
                    {t("entrance")}
                    {opt}
                  </span>
                  <input className="form-input" {...register("delivery_entrance")} />
                </label>
                <label className="min-w-0 md:text-sm">
                  <span className="form-label">
                    {t("floor")}
                    {opt}
                  </span>
                  <input className="form-input" {...register("delivery_floor")} />
                </label>
                <label className="min-w-0 md:text-sm">
                  <span className="form-label">
                    {t("apartment")}
                    {opt}
                  </span>
                  <input className="form-input" {...register("delivery_apartment")} />
                </label>
              </>
            )}
            <label className="min-w-0 md:col-span-2 md:text-sm">
              <span className="form-label">
                {t("recipientPhone")}
                {req}
              </span>
              <input
                type="tel"
                placeholder="+380..."
                className="form-input"
                {...register("recipient_phone")}
              />
            </label>
            <FieldError messageKey={errors.recipient_phone?.message} />
            <label className="min-w-0 md:col-span-2 md:text-sm">
              <span className="form-label">
                {t("giftMessage")}
                {opt}
              </span>
              <textarea
                rows={2}
                className="form-input min-h-[4.5rem] resize-y py-3"
                {...register("gift_message")}
              />
            </label>
          </div>
        ) : null}
      </section>

      <section className="space-y-4 rounded-xl border border-ink/12 bg-bg/60 p-5 shadow-sm md:p-6">
        <h2 className="eyebrow">{t("contact")}</h2>
        <label className="block min-w-0 md:text-sm">
          <span className="form-label">
            {t("customerName")}
            {req}
          </span>
          <input className="form-input" {...register("customer_name")} />
        </label>
        <FieldError messageKey={errors.customer_name?.message} />
        <label className="block min-w-0 md:text-sm">
          <span className="form-label">
            {t("customerPhone")}
            {req}
          </span>
          <input
            type="tel"
            placeholder="+380..."
            className="form-input"
            {...register("customer_phone")}
          />
        </label>
        <FieldError messageKey={errors.customer_phone?.message} />
        <label className="flex items-start gap-3 text-base text-muted md:text-sm">
          <input
            type="checkbox"
            {...register("prefer_messenger_contact")}
            className="mt-1"
          />
          <span>{t("preferMessengerContact")}</span>
        </label>
      </section>

      <section className="space-y-4 rounded-xl border border-ink/12 bg-bg/60 p-5 shadow-sm md:p-6">
        <h2 className="eyebrow">{t("orderTotalTitle")}</h2>
        <div className="flex justify-between gap-4 text-base md:text-sm">
          <span className="text-muted">{t("bouquetLine")}</span>
          <span className="shrink-0 tabular-nums text-ink">
            {formatMoney(
              Number.isFinite(bouquetAmount) ? bouquetAmount : 0,
              currency,
            )}
          </span>
        </div>
        {deliveryType === "delivery" && currency === "UAH" ? (
          <div className="flex justify-between gap-4 text-base md:text-sm">
            <span className="text-muted">{t("deliveryLine")}</span>
            <span className="shrink-0 text-right tabular-nums text-ink">
              {coordinate ? (
                <span className="text-muted">{t("deliveryFeeTbd")}</span>
              ) : deliveryFeeUah != null ? (
                formatMoney(deliveryFeeUah, "UAH")
              ) : (
                <span className="text-muted">{t("deliveryFeeFromQuote")}</span>
              )}
            </span>
          </div>
        ) : null}
        {currency === "UAH" && postcardFeeUah > 0 ? (
          <div className="flex justify-between gap-4 text-base md:text-sm">
            <span className="text-muted">{t("postcardLine")}</span>
            <span className="shrink-0 tabular-nums text-ink">
              {formatMoney(postcardFeeUah, "UAH")}
            </span>
          </div>
        ) : null}
        {deliveryType === "pickup" ? (
          <p className="text-sm md:text-[11px] leading-relaxed text-muted">{t("pickupNoFee")}</p>
        ) : null}
        <div className="flex justify-between gap-4 border-t border-ink/20 pt-4 font-display text-lg font-medium tracking-tight">
          <span>
            {paymentMethod === "prepay" ? t("totalToPayNow") : t("totalEstimated")}
          </span>
          <span className="shrink-0 tabular-nums">
            {deliveryFeeKnown ? (
              formatMoney(
                Number.isFinite(totalToCharge) ? totalToCharge : 0,
                currency,
              )
            ) : (
              <span className="text-muted">{t("totalPendingQuote")}</span>
            )}
          </span>
        </div>
        {!deliveryFeeKnown ? (
          <p className="text-sm md:text-[11px] leading-relaxed text-muted">
            {t("totalPendingQuoteHint")}
          </p>
        ) : null}
        {paymentMethod === "prepay" &&
        deliveryType === "delivery" &&
        coordinate ? (
          <p className="text-sm md:text-[11px] leading-relaxed text-muted">
            {t("prepayBouquetOnlyNote")}
          </p>
        ) : null}
      </section>

      <section className="space-y-4 rounded-xl border border-ink/12 bg-bg/60 p-5 shadow-sm md:p-6">
        <h2 className="eyebrow">{t("payment")}</h2>

        <div className="flex flex-col gap-3">
          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-ink/15 p-4 transition-colors hover:border-ink/30 has-[:checked]:border-ink has-[:checked]:bg-ink/[0.04]">
            <input
              type="radio"
              value="reserve"
              {...register("payment_method")}
              className="mt-0.5 shrink-0"
            />
            <div>
              <span className="block text-base font-medium text-ink md:text-sm">{t("reserve")}</span>
              <span className="mt-0.5 block text-sm md:text-[11px] leading-relaxed text-muted">
                {t("reserveDescription")}
              </span>
            </div>
          </label>
          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-ink/15 p-4 transition-colors hover:border-ink/30 has-[:checked]:border-ink has-[:checked]:bg-ink/[0.04]">
            <input
              type="radio"
              value="prepay"
              {...register("payment_method")}
              className="mt-0.5 shrink-0"
            />
            <div>
              <span className="block text-base font-medium text-ink md:text-sm">{t("payNow")}</span>
              <span className="mt-0.5 block text-sm md:text-[11px] leading-relaxed text-muted">
                {t("payNowDescription")}
              </span>
            </div>
          </label>
        </div>

        <div className="space-y-2 border-t border-ink/10 pt-4">
          <label className="flex cursor-pointer items-start gap-3 text-base text-muted md:text-sm">
            <input
              type="checkbox"
              {...register("privacy_accepted")}
              className="mt-1"
            />
            <span>
              {t("privacy")}{" "}
              <Link href="/privacy" className="text-ink underline-offset-2 hover:underline">
                {t("privacyPolicyLink")}
              </Link>
              <span className="whitespace-nowrap text-ink">{req}</span>
            </span>
          </label>
          <FieldError messageKey={errors.privacy_accepted?.message} />
        </div>

        {formError ? <p className="text-base text-red-800 md:text-sm">{formError}</p> : null}

        <button
          type="submit"
          disabled={loading}
          className="btn-pill w-full justify-center"
        >
          {loading ? t("submitting") : paymentMethod === "prepay" ? t("payNow") : t("reserve")}
        </button>
      </section>
    </form>
  );
}
