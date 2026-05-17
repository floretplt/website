"use client";

import { Link, useRouter } from "@/i18n/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Controller, useForm, type Resolver } from "react-hook-form";
import { useCallback, useEffect, useMemo, useState } from "react";
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
import {
  FLORET_LIQPAY_STORAGE_KEY,
  pendingLiqPayCookieHeader,
  serializePendingLiqPay,
} from "@/lib/liqpay-pending-cookie";
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

type DeliveryHighlightStep =
  | "addressMode"
  | "zone"
  | "when"
  | "address"
  | "recipient";

const DELIVERY_STEP_SCROLL_ID: Record<DeliveryHighlightStep, string> = {
  addressMode: "order-address-mode",
  zone: "order-delivery-zone",
  when: "order-delivery-when",
  address: "order-delivery-address",
  recipient: "order-delivery-recipient",
};

function recipientPhoneReady(phone: string | null | undefined): boolean {
  const raw = phone?.trim();
  if (!raw) return false;
  return /^\+380\d{9}$/.test(normalizeUaPhone(raw));
}

function pickRhfMessage(err: unknown): string | undefined {
  if (!err || typeof err !== "object") return undefined;
  const o = err as { message?: unknown };
  const { message } = o;
  if (typeof message === "string" && message.length > 0) return message;
  if (Array.isArray(message)) {
    for (const item of message) {
      if (typeof item === "string" && item.length > 0) return item;
    }
  }
  return undefined;
}

function FieldError({ err }: { err?: unknown }) {
  const t = useTranslations("order.validation");
  const messageKey = pickRhfMessage(err);
  if (!messageKey) return null;
  if (!VALIDATION_CODES.includes(messageKey as (typeof VALIDATION_CODES)[number])) {
    return <p className="text-error">{messageKey}</p>;
  }
  return (
    <p className="text-error">
      {t(messageKey as (typeof VALIDATION_CODES)[number])}
    </p>
  );
}

export function OrderForm({
  initialProduct,
  defaultProductSize,
  minDeliveryDate,
  minPickupDate,
  deliveryBands = [],
  deliveryDistricts = [],
  namedZones,
}: Props) {
  const t = useTranslations("order");
  const ts = useTranslations("sizes");
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submittingMethod, setSubmittingMethod] = useState<
    "reserve" | "prepay" | null
  >(null);
  const [addressModeChosen, setAddressModeChosen] = useState(false);
  const [deliveryHighlight, setDeliveryHighlight] =
    useState<DeliveryHighlightStep | null>(null);

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
    setFocus,
    formState: { errors },
  } = useForm<OrderCreateInput>({
    resolver: zodResolver(orderCreateSchema) as Resolver<OrderCreateInput>,
    defaultValues: defaultValues as OrderCreateInput,
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  const deliveryType = watch("delivery_type");
  const watchedSize = watch("product_size");
  const coordinate = watch("coordinate_address_with_recipient");
  const deliveryDistrictId = watch("delivery_district_id");
  const watchDeliveryTime = watch("delivery_time");
  const pricePaidWatch = watch("price_paid");
  const giftMessageWatch = watch("gift_message");
  const deliveryBandMaxKm = watch("delivery_band_max_km");
  const deliveryZoneId = watch("delivery_zone_id");
  const watchDeliveryDate = watch("delivery_date");
  const watchDeliveryAddress = watch("delivery_address");
  const watchRecipientPhone = watch("recipient_phone");

  const scrollToDeliveryStep = useCallback((step: DeliveryHighlightStep) => {
    requestAnimationFrame(() => {
      document
        .getElementById(DELIVERY_STEP_SCROLL_ID[step])
        ?.scrollIntoView({ block: "center", behavior: "smooth" });
    });
  }, []);

  const switchToPickup = useCallback(() => {
    setAddressModeChosen(false);
    setDeliveryHighlight(null);
    setValue("delivery_type", "pickup", {
      shouldValidate: true,
      shouldDirty: true,
    });
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
  }, [minPickupDate, pickupSlots, setValue]);

  const switchToDelivery = useCallback(() => {
    setAddressModeChosen(false);
    setDeliveryHighlight(null);
    setValue("delivery_type", "delivery", {
      shouldValidate: true,
      shouldDirty: true,
    });
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
  }, [minDeliveryDate, setValue]);

  const selectAddressMode = useCallback(
    (coordinateWithRecipient: boolean) => {
      setAddressModeChosen(true);
      setDeliveryHighlight((h) => (h === "addressMode" ? null : h));
      setValue("coordinate_address_with_recipient", coordinateWithRecipient, {
        shouldDirty: true,
      });
      setValue("delivery_date", minDeliveryDate, { shouldDirty: true });
      setValue("delivery_time", null, { shouldDirty: true });
      setValue("delivery_address", null);
      setValue("delivery_entrance", null);
      setValue("delivery_floor", null);
      setValue("delivery_apartment", null);
      setValue("recipient_phone", null);
      setValue("delivery_district_id", null);
      setValue("delivery_band_max_km", null);
      setValue("delivery_zone_id", null);
    },
    [minDeliveryDate, setValue],
  );

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

  const zoneStepRequired =
    addressModeChosen &&
    !coordinate &&
    currency === "UAH" &&
    (namedZones.length > 0 ||
      hasDistrictMatrix ||
      (deliveryBands.length > 0 && namedZones.length === 0 && !hasDistrictMatrix));

  const zoneStepComplete =
    !zoneStepRequired ||
    (namedZones.length > 0 && Boolean(deliveryZoneId?.trim())) ||
    (hasDistrictMatrix && Boolean(deliveryDistrictId?.trim())) ||
    (deliveryBands.length > 0 &&
      namedZones.length === 0 &&
      !hasDistrictMatrix &&
      deliveryBandMaxKm != null);

  const whenStepComplete =
    Boolean(watchDeliveryDate?.trim()) && Boolean(watchDeliveryTime?.trim());

  const addressStepComplete = Boolean(watchDeliveryAddress?.trim());

  const showZoneStep = addressModeChosen && !coordinate && zoneStepRequired;
  const showWhenStep = addressModeChosen && (coordinate || zoneStepComplete);
  const showAddressStep =
    addressModeChosen && !coordinate && whenStepComplete;
  const showRecipientStep =
    addressModeChosen &&
    whenStepComplete &&
    (coordinate || addressStepComplete);

  const getFirstIncompleteDeliveryStep = useCallback((): DeliveryHighlightStep | null => {
    if (deliveryType !== "delivery") return null;
    if (!addressModeChosen) return "addressMode";
    if (zoneStepRequired && !zoneStepComplete) return "zone";
    const whenVisible = addressModeChosen && (coordinate || zoneStepComplete);
    if (whenVisible && !whenStepComplete) return "when";
    if (!coordinate && whenStepComplete && !addressStepComplete) return "address";
    const recipientVisible =
      addressModeChosen && whenStepComplete && (coordinate || addressStepComplete);
    if (recipientVisible && !recipientPhoneReady(watchRecipientPhone)) {
      return "recipient";
    }
    return null;
  }, [
    deliveryType,
    addressModeChosen,
    zoneStepRequired,
    zoneStepComplete,
    coordinate,
    whenStepComplete,
    addressStepComplete,
    watchRecipientPhone,
  ]);

  const zoneStepErrorMessage = useCallback(() => {
    if (namedZones.length > 0) return t("deliveryNamedZoneRequired");
    if (hasDistrictMatrix) return t("deliveryDistrictRequired");
    return t("deliveryTierRequired");
  }, [namedZones.length, hasDistrictMatrix, t]);

  useEffect(() => {
    if (deliveryHighlight === "zone" && zoneStepComplete) {
      setDeliveryHighlight(null);
    }
  }, [deliveryHighlight, zoneStepComplete]);

  useEffect(() => {
    if (deliveryHighlight === "when" && whenStepComplete) {
      setDeliveryHighlight(null);
    }
  }, [deliveryHighlight, whenStepComplete]);

  useEffect(() => {
    if (deliveryHighlight === "address" && addressStepComplete) {
      setDeliveryHighlight(null);
    }
  }, [deliveryHighlight, addressStepComplete]);

  useEffect(() => {
    if (
      deliveryHighlight === "recipient" &&
      recipientPhoneReady(watchRecipientPhone)
    ) {
      setDeliveryHighlight(null);
    }
  }, [deliveryHighlight, watchRecipientPhone]);

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
    setSubmittingMethod(values.payment_method);
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
      const payJson = (await pay.json()) as {
        data?: string;
        signature?: string;
        checkoutUrl?: string;
        orderNumber?: number;
        liqpayOrderId?: string;
      };

      if (
        !pay.ok ||
        !payJson.data ||
        !payJson.signature ||
        !payJson.checkoutUrl ||
        !payJson.checkoutUrl.startsWith("https://www.liqpay.ua/")
      ) {
        setFormError(t("error"));
        setLoading(false);
        return;
      }

      const orderNum = payJson.orderNumber ?? json.orderNumber;
      const liqpayOrderId = payJson.liqpayOrderId ?? "";
      if (orderNum != null && liqpayOrderId && json.id) {
        const pending = {
          orderId: json.id,
          orderNumber: orderNum,
          liqpayOrderId,
        };
        document.cookie = pendingLiqPayCookieHeader(pending);
        try {
          sessionStorage.setItem(
            FLORET_LIQPAY_STORAGE_KEY,
            serializePendingLiqPay(pending),
          );
        } catch {
          /* private mode quota */
        }
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
      setSubmittingMethod(null);
    }
  };

  const runSubmit = (payment_method: "reserve" | "prepay") => {
    const incomplete = getFirstIncompleteDeliveryStep();
    if (incomplete) {
      setDeliveryHighlight(incomplete);
      scrollToDeliveryStep(incomplete);
      return;
    }
    setDeliveryHighlight(null);
    void handleSubmit(
      (formValues) => onSubmit({ ...formValues, payment_method }),
      (invalid) => {
        const blocked = getFirstIncompleteDeliveryStep();
        if (blocked) {
          setDeliveryHighlight(blocked);
          scrollToDeliveryStep(blocked);
          return;
        }
        const keys = Object.keys(invalid) as (keyof OrderCreateInput)[];
        const first = keys[0];
        if (!first) return;
        void setFocus(first, { shouldSelect: true });
        requestAnimationFrame(() => {
          const name = String(first);
          const el = document.querySelector<HTMLElement>(`[name="${name}"]`);
          el?.scrollIntoView({ block: "center", behavior: "smooth" });
        });
      },
    )();
  };

  const req = t("requiredStar");
  const opt = t("optionalTag");

  const choiceOn =
    "border-rose bg-rose/10 text-rose shadow-sm ring-1 ring-rose/35";
  const choiceOff = "border-ink/20 text-muted hover:border-ink/35";
  const choiceError =
    "border-red-700 bg-red-50 text-red-900 ring-2 ring-red-600/35";
  const inputErrorClass = "border-red-700 ring-2 ring-red-600/35";
  const stepRingError = "rounded-lg ring-2 ring-red-600/35";
  const zoneCardError =
    "border-red-600/70 bg-red-50/50 hover:border-red-700";
  const zoneCardOff = "border-ink/20 hover:border-ink/45";
  const zoneCardOn = "border-ink bg-ink/[0.04] ring-1 ring-ink";
  const chipOn = "border-rose bg-rose/20 text-ink ring-1 ring-rose/50";
  const chipOff = "border-ink/20 text-muted hover:border-ink/40";
  const highlightZone = deliveryHighlight === "zone" && !zoneStepComplete;
  const highlightWhen = deliveryHighlight === "when" && !whenStepComplete;
  const highlightAddress =
    deliveryHighlight === "address" && !addressStepComplete;
  const highlightRecipient =
    deliveryHighlight === "recipient" &&
    !recipientPhoneReady(watchRecipientPhone);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
      }}
      className="order-form mx-auto min-h-screen max-w-6xl bg-[#F4F3F1] px-4 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-16"
    >
      <h1>{t("title")}</h1>

      <div className="flex flex-col gap-8 lg:grid lg:grid-cols-12 lg:items-start lg:gap-x-10 lg:gap-y-8">
          <section className="min-w-0 space-y-5 rounded-xl border border-ink/12 bg-bg p-5 shadow-sm md:p-6 lg:col-span-7 lg:col-start-1 lg:row-start-1">
            <h2 className="form-section-title">{t("sectionProduct")}</h2>
            {initialProduct && previewSrc ? (
              <>
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-6">
                <div className="mx-auto w-full max-w-[9.5rem] shrink-0 sm:mx-0 sm:max-w-[10.5rem]">
                  <ProductImageLightbox
                    images={[previewSrc]}
                    alt={defaultName}
                    sizes="(max-width: 640px) 152px, 168px"
                    aspectClassName="aspect-square w-full"
                  />
                </div>
                <div className="min-w-0 flex-1 space-y-4">
                  <p className="font-medium">{defaultName}</p>
                  <p className="text-body-muted">
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
                  <div>
                    <p className="form-label mb-3">
                      {t("bouquetSize")}
                      {req}
                    </p>
                    <Controller
                      name="product_size"
                      control={control}
                      render={({ field }) => (
                        <div className="flex flex-wrap gap-2">
                          {sizeOptions.map((s) => (
                            <button
                              key={s}
                              type="button"
                              title={ts(s)}
                              onClick={() => {
                                field.onChange(s);
                                const tier = productPriceForSize(initialProduct, s);
                                const next =
                                  tier != null && tier > 0 ? tier : smallTierMin;
                                setValue("price_paid", next, {
                                  shouldValidate: true,
                                  shouldDirty: true,
                                });
                              }}
                              className={`form-chip ${
                                field.value === s ? chipOn : chipOff
                              }`}
                            >
                              {s === "small" ? "S" : s === "medium" ? "M" : "L"}
                            </button>
                          ))}
                        </div>
                      )}
                    />
                    <FieldError err={errors.product_size} />
                  </div>
                  <div>
                    <label className="block min-w-0">
                      <span className="form-label">
                        {t("agreedAmount")}
                        {req}
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        min={smallTierMin}
                        className="form-input tabular-nums"
                        {...register("price_paid", {
                          valueAsNumber: true,
                          validate: (v) => {
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
                    <p className="mt-1 form-hint">
                      {t("agreedAmountHint")}
                    </p>
                    <p className="mt-1 form-hint">
                      {t("priceFloorHint", {
                        min: formatMoney(smallTierMin, currency),
                      })}
                    </p>
                    <FieldError err={errors.price_paid} />
                    <input type="hidden" {...register("currency")} value={currency} />
                  </div>
                </div>
                </div>
                <p className="mt-5 text-body-muted">
                  {t("compositionDisclaimer")}
                </p>
              </>
            ) : (
              <div className="space-y-4">
                {previewSrc ? (
                  <div className="mx-auto max-w-[280px]">
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
                    <p className="font-medium">{defaultName}</p>
                    <p className="mt-2 text-body-muted">
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
                    <FieldError err={errors.product_name} />
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
                        {(initialProduct ? sizeOptions : (["small", "medium", "large"] as const)).map(
                          (s) => (
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
                              className={`form-chip ${
                                field.value === s ? chipOn : chipOff
                              }`}
                            >
                              {s === "small" ? "S" : s === "medium" ? "M" : "L"}
                            </button>
                          ),
                        )}
                      </div>
                    )}
                  />
                  <FieldError err={errors.product_size} />
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
                      <p className="mt-1 form-hint">
                        {t("agreedAmountHint")}
                      </p>
                      <p className="mt-1 form-hint">
                        {t("priceFloorHint", {
                          min: formatMoney(smallTierMin, currency),
                        })}
                      </p>
                    </>
                  ) : null}
                  <FieldError err={errors.price_paid} />
                  <input type="hidden" {...register("currency")} value={currency} />
                </div>
                <p className="mt-4 text-body-muted">
                  {t("compositionDisclaimer")}
                </p>
              </div>
            )}
          </section>

          <section className="min-w-0 space-y-5 rounded-xl border border-ink/12 bg-bg p-5 shadow-sm md:p-6 lg:col-span-7 lg:col-start-1 lg:row-start-2">
            <h2 className="form-section-title">{t("sectionDelivery")}</h2>
            <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={switchToPickup}
                className={`form-choice ${
                  deliveryType === "pickup" ? choiceOn : choiceOff
                }`}
              >
                <span className="text-base leading-none" aria-hidden>
                  🛍
                </span>
                <span>{t("pickup")}</span>
              </button>
              <button
                type="button"
                onClick={switchToDelivery}
                className={`form-choice ${
                  deliveryType === "delivery" ? choiceOn : choiceOff
                }`}
              >
                <span className="text-base leading-none" aria-hidden>
                  🚚
                </span>
                <span>{t("deliveryOption")}</span>
              </button>
            </div>

        {deliveryType === "pickup" ? (
          <div className="grid min-w-0 gap-4 md:grid-cols-2">
            <div className="min-w-0">
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
              <FieldError err={errors.delivery_date} />
            </div>
            <div className="min-w-0 text-body-muted">
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
              <FieldError err={errors.delivery_time} />
            </div>
          </div>
        ) : null}

        {deliveryType === "delivery" ? (
          <div className="grid min-w-0 gap-4 md:grid-cols-2">
            <div id="order-address-mode" className="md:col-span-2 space-y-3">
              <p className="form-label mb-2">{t("addressModeTitle")}</p>
              <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => selectAddressMode(false)}
                  className={`form-choice ${
                    deliveryHighlight === "addressMode" && !addressModeChosen
                      ? choiceError
                      : addressModeChosen && !coordinate
                        ? choiceOn
                        : choiceOff
                  }`}
                >
                  {t("addressModeKnow")}
                </button>
                <button
                  type="button"
                  onClick={() => selectAddressMode(true)}
                  className={`form-choice ${
                    deliveryHighlight === "addressMode" && !addressModeChosen
                      ? choiceError
                      : addressModeChosen && coordinate
                        ? choiceOn
                        : choiceOff
                  }`}
                >
                  {t("coordinateAddressLabel")}
                </button>
              </div>
              {!addressModeChosen ? (
                <p
                  className={
                    deliveryHighlight === "addressMode"
                      ? "text-error"
                      : "form-hint"
                  }
                  role={
                    deliveryHighlight === "addressMode" ? "alert" : undefined
                  }
                >
                  {deliveryHighlight === "addressMode"
                    ? t("addressModeRequired")
                    : t("addressModeHint")}
                </p>
              ) : null}
              {addressModeChosen && coordinate ? (
                <p className="form-hint">{t("coordinateAddressHelp")}</p>
              ) : null}
            </div>

            {showZoneStep ? (
              <div
                id="order-delivery-zone"
                className={`md:col-span-2 space-y-4 ${
                  highlightZone ? stepRingError : ""
                }`}
              >
            {showBandHintTable ? (
              <div className="rounded-lg border border-ink/15 bg-ink/[0.02] p-4">
                <p className="form-label mb-0">{t("deliveryPricingTitle")}</p>
                <div className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
                  <table className="text-body-muted mt-3 w-full min-w-[16rem] max-w-md">
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
                <p className="mt-3 form-hint">
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
                            onClick={() => {
                              field.onChange(selected ? null : b.max_km);
                              setDeliveryHighlight((h) =>
                                h === "zone" ? null : h,
                              );
                            }}
                            className={`text-body flex flex-col gap-1 border-2 px-4 py-3 text-left transition-colors ${
                              selected
                                ? zoneCardOn
                                : highlightZone
                                  ? zoneCardError
                                  : zoneCardOff
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
                    <p className="form-hint">
                      {t("deliveryTierHint")}
                    </p>
                  </div>
                )}
              />
            ) : null}
            {currency === "UAH" && namedZones.length > 0 ? (
              <Controller
                name="delivery_zone_id"
                control={control}
                render={({ field }) => (
                  <div className="text-body-muted md:col-span-2 space-y-3">
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
                            onClick={() => {
                              field.onChange(z.id);
                              setDeliveryHighlight((h) =>
                                h === "zone" ? null : h,
                              );
                            }}
                            className={`relative flex w-full flex-col gap-1 border-2 px-4 py-3.5 pr-11 text-left transition-colors ${
                              selected
                                ? zoneCardOn
                                : highlightZone
                                  ? zoneCardError
                                  : zoneCardOff
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
                              <span className="pr-2 form-hint">
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
                  </div>
                )}
              />
            ) : null}
            {currency === "UAH" && hasDistrictMatrix ? (
              <Controller
                name="delivery_district_id"
                control={control}
                render={({ field }) => (
                  <div className="text-body-muted md:col-span-2 space-y-3">
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
                            onClick={() => {
                              field.onChange(d.id);
                              setDeliveryHighlight((h) =>
                                h === "zone" ? null : h,
                              );
                            }}
                            className={`relative flex w-full flex-col gap-1 border-2 px-4 py-3.5 pr-11 text-left transition-colors ${
                              selected
                                ? zoneCardOn
                                : highlightZone
                                  ? zoneCardError
                                  : zoneCardOff
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
                  </div>
                )}
              />
            ) : null}
                {highlightZone ? (
                  <p className="text-error" role="alert">
                    {zoneStepErrorMessage()}
                  </p>
                ) : null}
              </div>
            ) : null}
            {showWhenStep ? (
              <div
                id="order-delivery-when"
                className={`md:col-span-2 grid gap-4 md:grid-cols-2 ${
                  highlightWhen ? stepRingError : ""
                }`}
              >
            <div className="min-w-0 text-body-muted">
              <label className="block min-w-0">
                <span className="form-label">
                  {t("deliveryDate")}
                  {req}
                </span>
                <input
                  type="date"
                  min={minDeliveryDate}
                  lang="uk"
                  className={`form-input max-w-full ${
                    highlightWhen && !watchDeliveryDate?.trim()
                      ? inputErrorClass
                      : ""
                  }`}
                  {...register("delivery_date")}
                />
              </label>
              <FieldError err={errors.delivery_date} />
            </div>
            <div className="min-w-0 text-body-muted">
              <label className="block min-w-0">
                <span className="form-label">
                  {t("deliveryTime")}
                  {req}
                </span>
                <select
                  className={`form-input ${
                    highlightWhen && !watchDeliveryTime?.trim()
                      ? inputErrorClass
                      : ""
                  }`}
                  {...register("delivery_time")}
                >
                  <option value="">—</option>
                  <option value="morning">{t("timeMorning")}</option>
                  <option value="afternoon">{t("timeAfternoon")}</option>
                  <option value="evening">{t("timeEvening")}</option>
                </select>
              </label>
              <p className="mt-1 form-hint">
                {t("deliveryTimeApproxHint")}
              </p>
              <FieldError err={errors.delivery_time} />
            </div>
                {highlightWhen ? (
                  <p className="md:col-span-2 text-error" role="alert">
                    {t("deliveryWhenRequired")}
                  </p>
                ) : null}
              </div>
            ) : null}
            {showAddressStep ? (
              <>
                <div
                  id="order-delivery-address"
                  className={`min-w-0 md:col-span-2 space-y-0 ${
                    highlightAddress ? stepRingError : ""
                  }`}
                >
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
                        className={`form-input ${
                          highlightAddress ? inputErrorClass : ""
                        }`}
                        placeholder={t("addressPlaceholder")}
                        fallbackHint={!mapsKey ? t("addressManualFallback") : undefined}
                      />
                    )}
                  />
                  <FieldError err={errors.delivery_address} />
                  {highlightAddress ? (
                    <p className="mt-1 text-error" role="alert">
                      {t("validation.deliveryAddressRequired")}
                    </p>
                  ) : null}
                </div>
                <label className="min-w-0 md:col-span-2">
                  <span className="form-label">
                    {t("entrance")}
                    {opt}
                  </span>
                  <input className="form-input" {...register("delivery_entrance")} />
                </label>
                <label className="min-w-0">
                  <span className="form-label">
                    {t("floor")}
                    {opt}
                  </span>
                  <input className="form-input" {...register("delivery_floor")} />
                </label>
                <label className="min-w-0">
                  <span className="form-label">
                    {t("apartment")}
                    {opt}
                  </span>
                  <input className="form-input" {...register("delivery_apartment")} />
                </label>
              </>
            ) : null}
            {showRecipientStep ? (
              <>
            <div
              id="order-delivery-recipient"
              className={`min-w-0 md:col-span-2 ${
                highlightRecipient ? stepRingError : ""
              }`}
            >
            <label className="block min-w-0">
              <span className="form-label">
                {t("recipientPhone")}
                {req}
              </span>
              <input
                type="tel"
                placeholder="+380..."
                className={`form-input ${
                  highlightRecipient ? inputErrorClass : ""
                }`}
                {...register("recipient_phone")}
              />
            </label>
            <FieldError err={errors.recipient_phone} />
            {highlightRecipient ? (
              <p className="mt-1 text-error" role="alert">
                {t("validation.recipientPhoneRequired")}
              </p>
            ) : null}
            </div>
            <label className="min-w-0 md:col-span-2">
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
              </>
            ) : null}
          </div>
        ) : null}
      </section>

          <section className="min-w-0 space-y-4 rounded-xl border border-ink/12 bg-bg p-5 shadow-sm md:p-6 lg:col-span-7 lg:col-start-1 lg:row-start-3">
            <h2 className="form-section-title">{t("sectionContact")}</h2>
            <label className="block min-w-0">
              <span className="form-label">
                {t("customerName")}
                {req}
              </span>
              <input className="form-input" {...register("customer_name")} />
            </label>
            <FieldError err={errors.customer_name} />
            <label className="block min-w-0">
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
            <FieldError err={errors.customer_phone} />
            <label className="flex items-start gap-3 text-body-muted">
              <input
                type="checkbox"
                {...register("prefer_messenger_contact")}
                className="mt-1"
              />
              <span>{t("preferMessengerContact")}</span>
            </label>
          </section>

        <div className="flex min-w-0 flex-col gap-8 lg:col-span-5 lg:col-start-8 lg:row-start-1 lg:row-span-3 lg:flex lg:flex-col lg:gap-6 lg:self-start lg:sticky lg:top-24">
          <section className="min-w-0 space-y-3 rounded-xl border border-ink/12 bg-bg p-5 shadow-sm md:p-6 lg:order-2">
            <label className="block min-w-0">
              <span className="form-label">{t("sidebarNotesLabel")}</span>
              <textarea
                rows={3}
                placeholder={t("sidebarNotesPlaceholder")}
                className="form-input min-h-[5.5rem] resize-y py-3"
                {...register("notes")}
              />
            </label>
          </section>

          <section className="min-w-0 space-y-4 rounded-xl border border-ink/12 bg-bg p-5 shadow-sm md:p-6 lg:order-1">
            <h2 className="form-section-title">{t("orderTotalTitle")}</h2>
            <div className="flex justify-between gap-4 text-body-muted">
              <span className="text-muted">{t("bouquetLine")}</span>
              <span className="shrink-0 tabular-nums text-ink">
                {formatMoney(
                  Number.isFinite(bouquetAmount) ? bouquetAmount : 0,
                  currency,
                )}
              </span>
            </div>
            <div className="flex justify-between gap-4 text-body-muted">
              <span>{t("deliveryLine")}</span>
              <span className="shrink-0 text-right tabular-nums text-ink">
                {deliveryType === "pickup" ? (
                  <span className="text-muted">{t("totalPendingQuote")}</span>
                ) : currency === "UAH" ? (
                  coordinate ? (
                    <span className="text-muted">{t("deliveryFeeTbd")}</span>
                  ) : deliveryFeeUah != null ? (
                    formatMoney(deliveryFeeUah, "UAH")
                  ) : (
                    <span className="text-muted">{t("deliveryFeeFromQuote")}</span>
                  )
                ) : (
                  <span className="text-muted">{t("totalPendingQuote")}</span>
                )}
              </span>
            </div>
            {currency === "UAH" && postcardFeeUah > 0 ? (
              <div className="flex justify-between gap-4 text-body-muted">
                <span>{t("postcardLine")}</span>
                <span className="shrink-0 tabular-nums text-ink">
                  {formatMoney(postcardFeeUah, "UAH")}
                </span>
              </div>
            ) : null}
            <div className="flex justify-between gap-4 border-t border-ink/20 pt-4 font-semibold">
              <span>{t("totalEstimated")}</span>
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
              <p className="form-hint">
                {t("totalPendingQuoteHint")}
              </p>
            ) : null}
          </section>

          <section className="min-w-0 space-y-5 rounded-xl border border-ink/12 bg-bg p-5 shadow-sm md:p-6 lg:order-3">
            <h2 className="form-section-title">{t("payment")}</h2>

            <div className="flex flex-col gap-3">
              <button
                type="button"
                disabled={loading}
                onClick={() => runSubmit("reserve")}
                className="btn-cta"
              >
                {loading && submittingMethod === "reserve"
                  ? t("submitting")
                  : t("reserveCta")}
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => runSubmit("prepay")}
                className="btn-cta-outline"
              >
                {loading && submittingMethod === "prepay"
                  ? t("submitting")
                  : t("prepayCta")}
              </button>
            </div>

            <div className="space-y-2 border-t border-ink/10 pt-4">
              <label className="flex cursor-pointer items-start gap-3 text-body-muted">
                <input
                  type="checkbox"
                  {...register("privacy_accepted")}
                  className="mt-1"
                />
                <span>
                  {t("privacy")}{" "}
                  <Link
                    href="/privacy"
                    className="text-rose underline underline-offset-2 transition-colors hover:text-ink"
                  >
                    {t("privacyPolicyLink")}
                  </Link>
                  <span className="whitespace-nowrap text-ink">{req}</span>
                </span>
              </label>
              <FieldError err={errors.privacy_accepted} />
            </div>

            {formError ? (
              <p className="text-error">{formError}</p>
            ) : null}
          </section>
        </div>
      </div>
    </form>
  );
}
