"use client";

import { useRouter } from "@/i18n/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Controller, useForm } from "react-hook-form";
import { useMemo, useState } from "react";
import type { ProductRow } from "@/lib/types/database";
import type { Locale } from "@/i18n/routing";
import type { Size } from "@/lib/constants";
import {
  orderCreateSchema,
  type OrderCreateInput,
} from "@/lib/validators";
import {
  offeredSizes,
  productCurrency,
  productMinPrice,
  productName,
  productPriceForSize,
} from "@/lib/product-display";
import { formatMoney } from "@/lib/format";
import { AddressAutocomplete } from "@/components/shop/AddressAutocomplete";
import { normalizeUaPhone } from "@/lib/phone";

type Props = {
  locale: Locale;
  initialProduct: ProductRow | null;
  /** From `?size=` when present (small | medium | large). */
  defaultProductSize?: Size;
  /** YYYY-MM-DD — earliest delivery date (Kyiv, same-day order cutoff). */
  minDeliveryDate: string;
  sameDayOrderCutoff?: string;
  sameDayDeliveryEnd?: string;
};

const mapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

const VALIDATION_CODES = [
  "nameRequired",
  "phoneUa",
  "privacyRequired",
  "deliveryDateRequired",
  "deliveryTimeRequired",
  "deliveryAddressRequired",
  "recipientPhoneRequired",
  "recipientPhoneInvalid",
] as const;

const API_MESSAGE_KEYS = new Set([...VALIDATION_CODES]);

function FieldError({ messageKey }: { messageKey: string | undefined }) {
  const t = useTranslations("order.validation");
  if (!messageKey) return null;
  if (!VALIDATION_CODES.includes(messageKey as (typeof VALIDATION_CODES)[number])) {
    return <p className="text-sm text-red-800">{messageKey}</p>;
  }
  return (
    <p className="text-sm text-red-800">
      {t(messageKey as (typeof VALIDATION_CODES)[number])}
    </p>
  );
}

export function OrderForm({
  locale,
  initialProduct,
  defaultProductSize,
  minDeliveryDate,
  sameDayOrderCutoff,
  sameDayDeliveryEnd,
}: Props) {
  const t = useTranslations("order");
  const ts = useTranslations("sizes");
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const currency = productCurrency(locale);

  const { resolvedDefaultSize, minPriceFloor, defaultPriceForSize, defaultName } =
    useMemo(() => {
      if (!initialProduct) {
        return {
          resolvedDefaultSize: "medium" as Size,
          minPriceFloor: 0,
          defaultPriceForSize: 0,
          defaultName: "",
        };
      }
      const offered = offeredSizes(initialProduct, locale);
      const rs: Size =
        defaultProductSize && offered.includes(defaultProductSize)
          ? defaultProductSize
          : (offered[0] ?? "medium");
      const minP = productMinPrice(initialProduct, locale);
      const tier = productPriceForSize(initialProduct, locale, rs);
      return {
        resolvedDefaultSize: rs,
        minPriceFloor: minP,
        defaultPriceForSize: tier ?? minP,
        defaultName: productName(initialProduct, locale),
      };
    }, [initialProduct, locale, defaultProductSize]);

  const defaultValues = useMemo(
    () =>
      ({
        product_id: initialProduct?.id ?? null,
        product_name: defaultName,
        price_paid: initialProduct
          ? Math.max(defaultPriceForSize || 1, minPriceFloor || 0.01)
          : 1,
        currency,
        product_size: resolvedDefaultSize,
        customer_name: "",
        customer_phone: "",
        delivery_type: "pickup" as const,
        delivery_date: null,
        delivery_time: null,
        delivery_address: null,
        delivery_floor: null,
        delivery_apartment: null,
        recipient_phone: null,
        gift_message: null,
        notes: null,
        payment_method: "reserve" as const,
        privacy_accepted: false,
      }) as Partial<OrderCreateInput>,
    [
      initialProduct,
      defaultName,
      defaultPriceForSize,
      minPriceFloor,
      currency,
      resolvedDefaultSize,
    ],
  );

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<OrderCreateInput>({
    resolver: zodResolver(orderCreateSchema),
    defaultValues: defaultValues as OrderCreateInput,
    mode: "onBlur",
  });

  const deliveryType = watch("delivery_type");
  const paymentMethod = watch("payment_method");

  const sizeOptions = initialProduct ? offeredSizes(initialProduct, locale) : [];

  const onSubmit = async (values: OrderCreateInput) => {
    setFormError(null);
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
          router.push(`/order/${num}`);
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
      className="mx-auto max-w-xl space-y-10 px-6 py-12 md:px-0 md:py-16"
    >
      <h1 className="h-section">{t("title")}</h1>

      <section className="space-y-4 border-b border-ink/10 pb-8">
        <h2 className="eyebrow">{t("product")}</h2>
        {initialProduct ? (
          <>
            <p className="font-display text-2xl">{defaultName}</p>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              {sizeOptions.map((s, i) => {
                const pr = productPriceForSize(initialProduct, locale, s);
                if (pr == null) return null;
                const label = s === "small" ? "S" : s === "medium" ? "M" : "L";
                return (
                  <span key={s}>
                    {i > 0 ? " · " : null}
                    {label} — {formatMoney(pr, currency, locale)}
                  </span>
                );
              })}
            </p>
            <input type="hidden" {...register("product_name")} />
          </>
        ) : (
          <div className="space-y-3">
            <label className="block text-sm text-muted">
              <span className="mb-1 block uppercase tracking-wider">
                {t("productNameManual")}
                {req}
              </span>
              <input
                className="w-full border border-ink/20 bg-transparent px-3 py-2"
                {...register("product_name")}
              />
            </label>
            <FieldError messageKey={errors.product_name?.message} />
          </div>
        )}

        <div className="pt-2">
          <p className="mb-3 text-sm uppercase tracking-wider text-muted">
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
                      if (initialProduct) {
                        const pr = productPriceForSize(initialProduct, locale, s);
                        setValue(
                          "price_paid",
                          pr ?? minPriceFloor,
                          { shouldValidate: true, shouldDirty: true },
                        );
                      }
                    }}
                    className={`min-w-[3rem] border px-4 py-2 text-sm font-medium uppercase tracking-wider ${
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
          <label className="block text-sm text-muted">
            <span className="mb-1 block uppercase tracking-wider">
              {t("agreedAmount")}
              {req}
            </span>
            <input
              type="number"
              step="0.01"
              min={initialProduct ? minPriceFloor : 0.01}
              className="w-full border border-ink/20 bg-transparent px-3 py-2"
              {...register("price_paid", { valueAsNumber: true })}
            />
          </label>
          {initialProduct ? (
            <p className="mt-1 text-[11px] leading-relaxed text-muted">
              {t("priceFloorHint", {
                min: formatMoney(minPriceFloor, currency, locale),
              })}
            </p>
          ) : null}
          <FieldError messageKey={errors.price_paid?.message} />
          <input type="hidden" {...register("currency")} value={currency} />
        </div>
      </section>

      <section className="space-y-4 border-b border-ink/10 pb-8">
        <h2 className="eyebrow">
          {t("notes")}
          {opt}
        </h2>
        <textarea
          rows={4}
          className="w-full border border-ink/20 bg-transparent px-3 py-2 text-sm"
          placeholder={t("notesPlaceholder")}
          {...register("notes")}
        />
      </section>

      <section className="space-y-4 border-b border-ink/10 pb-8">
        <h2 className="eyebrow">{t("delivery")}</h2>
        <div className="flex gap-6 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              value="pickup"
              {...register("delivery_type")}
              onChange={() => {
                setValue("delivery_type", "pickup");
                setValue("delivery_date", null);
                setValue("delivery_time", null);
                setValue("delivery_address", null);
                setValue("delivery_floor", null);
                setValue("delivery_apartment", null);
                setValue("recipient_phone", null);
              }}
            />
            {t("pickup")}
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" value="delivery" {...register("delivery_type")} />
            {t("deliveryOption")}
          </label>
        </div>

        {deliveryType === "delivery" ? (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="text-sm text-muted">
              <label className="block">
                <span className="mb-1 block uppercase tracking-wider">
                  {t("deliveryDate")}
                  {req}
                </span>
                <input
                  type="date"
                  min={minDeliveryDate}
                  lang={locale === "uk" ? "uk" : "en"}
                  className="w-full border border-ink/20 bg-transparent px-3 py-2"
                  {...register("delivery_date")}
                />
              </label>
              <p className="mt-1 text-[11px] text-muted">{t("dateFormatHint")}</p>
              {sameDayOrderCutoff && sameDayDeliveryEnd ? (
                <p className="mt-2 text-[11px] leading-relaxed text-muted">
                  {t("deliverySameDayRules", {
                    orderCutoff: sameDayOrderCutoff,
                    deliveryEnd: sameDayDeliveryEnd,
                  })}
                </p>
              ) : null}
              <FieldError messageKey={errors.delivery_date?.message} />
            </div>
            <div className="text-sm text-muted">
              <label className="block">
                <span className="mb-1 block uppercase tracking-wider">
                  {t("deliveryTime")}
                  {req}
                </span>
                <select
                  className="w-full border border-ink/20 bg-transparent px-3 py-2"
                  {...register("delivery_time")}
                >
                  <option value="">—</option>
                  <option value="morning">{t("timeMorning")}</option>
                  <option value="afternoon">{t("timeAfternoon")}</option>
                  <option value="evening">{t("timeEvening")}</option>
                </select>
              </label>
              <FieldError messageKey={errors.delivery_time?.message} />
            </div>
            <div className="md:col-span-2 text-sm text-muted">
              <span className="mb-1 block uppercase tracking-wider">
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
            <label className="text-sm text-muted">
              <span className="mb-1 block uppercase tracking-wider">
                {t("floor")}
                {opt}
              </span>
              <input
                className="w-full border border-ink/20 bg-transparent px-3 py-2"
                {...register("delivery_floor")}
              />
            </label>
            <label className="text-sm text-muted">
              <span className="mb-1 block uppercase tracking-wider">
                {t("apartment")}
                {opt}
              </span>
              <input
                className="w-full border border-ink/20 bg-transparent px-3 py-2"
                {...register("delivery_apartment")}
              />
            </label>
            <label className="md:col-span-2 text-sm text-muted">
              <span className="mb-1 block uppercase tracking-wider">
                {t("recipientPhone")}
                {req}
              </span>
              <input
                type="tel"
                placeholder="+380..."
                className="w-full border border-ink/20 bg-transparent px-3 py-2"
                {...register("recipient_phone")}
              />
            </label>
            <FieldError messageKey={errors.recipient_phone?.message} />
            <label className="md:col-span-2 text-sm text-muted">
              <span className="mb-1 block uppercase tracking-wider">
                {t("giftMessage")}
                {opt}
              </span>
              <textarea
                rows={2}
                className="w-full border border-ink/20 bg-transparent px-3 py-2"
                {...register("gift_message")}
              />
            </label>
          </div>
        ) : null}
      </section>

      <section className="space-y-4 border-b border-ink/10 pb-8">
        <h2 className="eyebrow">{t("contact")}</h2>
        <label className="block text-sm text-muted">
          <span className="mb-1 block uppercase tracking-wider">
            {t("customerName")}
            {req}
          </span>
          <input
            className="w-full border border-ink/20 bg-transparent px-3 py-2"
            {...register("customer_name")}
          />
        </label>
        <FieldError messageKey={errors.customer_name?.message} />
        <label className="block text-sm text-muted">
          <span className="mb-1 block uppercase tracking-wider">
            {t("customerPhone")}
            {req}
          </span>
          <input
            type="tel"
            placeholder="+380..."
            className="w-full border border-ink/20 bg-transparent px-3 py-2"
            {...register("customer_phone")}
          />
        </label>
        <FieldError messageKey={errors.customer_phone?.message} />
      </section>

      <section className="space-y-4 border-b border-ink/10 pb-8">
        <h2 className="eyebrow">{t("payment")}</h2>
        <div className="flex flex-col gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input type="radio" value="reserve" {...register("payment_method")} />
            {t("reserve")}
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" value="prepay" {...register("payment_method")} />
            {t("payNow")}
          </label>
        </div>
      </section>

      <div className="space-y-2">
        <label className="flex items-start gap-3 text-sm text-muted">
          <input
            type="checkbox"
            {...register("privacy_accepted")}
            className="mt-1"
          />
          <span>
            {t("privacy")}
            <span className="whitespace-nowrap text-ink">{req}</span>
          </span>
        </label>
        <FieldError messageKey={errors.privacy_accepted?.message} />
      </div>

      {formError ? <p className="text-sm text-red-800">{formError}</p> : null}

      <button
        type="submit"
        disabled={loading}
        className="btn-pill w-full justify-center md:w-auto"
      >
        {loading ? t("submitting") : paymentMethod === "prepay" ? t("payNow") : t("reserve")}
      </button>
    </form>
  );
}
