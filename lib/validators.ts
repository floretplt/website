import { z } from "zod";
import {
  COLOR_MOODS,
  DELIVERY_TYPES,
  PAYMENT_METHODS,
  PRODUCT_CATEGORIES,
  SIZES,
} from "@/lib/constants";

import { normalizeUaPhone } from "@/lib/phone";

/** Message keys → translated in UI via `order.validation.*` */
const V = {
  nameRequired: "nameRequired",
  phoneUa: "phoneUa",
  privacyRequired: "privacyRequired",
  deliveryDate: "deliveryDateRequired",
  deliveryTime: "deliveryTimeRequired",
  pickupDate: "pickupDateRequired",
  pickupTime: "pickupTimeRequired",
  deliveryAddress: "deliveryAddressRequired",
  recipientPhone: "recipientPhoneRequired",
  recipientPhoneInvalid: "recipientPhoneInvalid",
} as const;

const phoneUa = z
  .string()
  .transform((s) => normalizeUaPhone(s))
  .pipe(z.string().regex(/^\+380\d{9}$/, { message: V.phoneUa }));

export const orderCreateSchema = z
  .object({
    product_id: z.union([z.string().uuid(), z.null()]).optional(),
    product_name: z
      .string()
      .min(1, { message: V.nameRequired })
      .max(500),
    price_paid: z.number().positive(),
    currency: z.enum(["UAH", "EUR"]),
    customer_name: z
      .string()
      .min(1, { message: V.nameRequired })
      .max(200),
    customer_phone: phoneUa,
    delivery_type: z.enum(DELIVERY_TYPES),
    delivery_date: z.string().optional().nullable(),
    delivery_time: z.string().optional().nullable(),
    delivery_address: z.string().optional().nullable(),
    delivery_floor: z.string().optional().nullable(),
    delivery_apartment: z.string().optional().nullable(),
    recipient_phone: z.string().optional().nullable(),
    gift_message: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
    /** Bouquet size chosen by the client (catalog styles are illustrative). */
    product_size: z.enum(SIZES),
    payment_method: z.enum(PAYMENT_METHODS),
    /** Prefer Viber/Telegram/WhatsApp instead of a phone call. */
    prefer_messenger_contact: z
      .boolean()
      .optional()
      .transform((v): boolean => v ?? false),
    /** When true, street address is unknown; we confirm with the recipient. */
    coordinate_address_with_recipient: z
      .boolean()
      .optional()
      .transform((v): boolean => v ?? false),
    /** District id from site settings `delivery_pricing.districts` (UAH matrix). */
    delivery_district_id: z.string().optional().nullable(),
    /** Named zone id from `delivery_pricing.zones` or built-in Poltava defaults. */
    delivery_zone_id: z.string().optional().nullable(),
    /**
     * When storefront uses distance tiers (bands) instead of districts: `max_km` of the chosen row.
     */
    delivery_band_max_km: z
      .union([z.number().positive(), z.null()])
      .optional()
      .transform((v) => v ?? null),
    privacy_accepted: z
      .boolean()
      .refine((v) => v === true, { message: V.privacyRequired }),
  })
  .superRefine((data, ctx) => {
    if (data.delivery_type === "pickup") {
      if (!data.delivery_date?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["delivery_date"],
          message: V.pickupDate,
        });
      }
      if (!data.delivery_time?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["delivery_time"],
          message: V.pickupTime,
        });
      }
    }

    if (data.delivery_type === "delivery") {
      const coordinate = data.coordinate_address_with_recipient === true;
      if (!data.delivery_date) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["delivery_date"],
          message: V.deliveryDate,
        });
      }
      if (!data.delivery_time) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["delivery_time"],
          message: V.deliveryTime,
        });
      }
      if (!coordinate && !data.delivery_address?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["delivery_address"],
          message: V.deliveryAddress,
        });
      }
      const raw = data.recipient_phone?.trim();
      if (!raw) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["recipient_phone"],
          message: V.recipientPhone,
        });
      } else {
        const n = normalizeUaPhone(raw);
        if (!/^\+380\d{9}$/.test(n)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["recipient_phone"],
            message: V.recipientPhoneInvalid,
          });
        }
      }
    }
  });

/** Decor / venue inquiry — message keys for UI: `home.decorRequestRequired`, `order.validation.*` */
export const decorInquirySchema = z.object({
  request: z
    .string()
    .min(1, { message: "decorRequestRequired" })
    .max(4000),
  customer_name: z.string().min(1, { message: "nameRequired" }).max(200),
  customer_phone: phoneUa,
  contact_preference: z.enum(["viber", "telegram", "call"]),
});

export type DecorInquiryInput = z.infer<typeof decorInquirySchema>;

const optionalPositiveUah = z.preprocess((v: unknown) => {
  if (v === "" || v === null || v === undefined) return null;
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}, z.union([z.number().positive(), z.null()]));

/** Admin product form — at least one S/M/L price; EUR computed server-side. */
export const productFormSchema = z
  .object({
    name_uk: z.string().min(1),
    name_en: z.string().min(1),
    description_uk: z.string().optional().nullable(),
    description_en: z.string().optional().nullable(),
    category: z.enum(PRODUCT_CATEGORIES),
    color_mood: z.enum(COLOR_MOODS),
    price_uah_small: optionalPositiveUah,
    price_uah_medium: optionalPositiveUah,
    price_uah_large: optionalPositiveUah,
    images: z.array(z.string()).optional().default([]),
    image_url: z
      .string()
      .optional()
      .nullable()
      .transform((s) => (s?.trim() ? s.trim() : null)),
    is_featured: z.boolean(),
    sort_order: z.number().int(),
  })
  .superRefine((data, ctx) => {
    const s = data.price_uah_small;
    const m = data.price_uah_medium;
    const l = data.price_uah_large;
    if (s == null && m == null && l == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["price_uah_small"],
        message: "atLeastOnePrice",
      });
      return;
    }
    if (s != null && m != null && s > m) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["price_uah_medium"],
        message: "mediumBelowSmall",
      });
    }
    if (m != null && l != null && m > l) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["price_uah_large"],
        message: "largeBelowMedium",
      });
    }
    if (s != null && l != null && m == null && s > l) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["price_uah_large"],
        message: "largeBelowSmall",
      });
    }
  });

/** Parsed order payload (after defaults / transforms). */
export type OrderCreateInput = z.output<typeof orderCreateSchema>;
