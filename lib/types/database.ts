import type { ColorMood, DeliveryType, OrderStatus, PaymentMethod, ProductCategory, Size } from "@/lib/constants";

export type ProductRow = {
  id: string;
  slug: string;
  name_uk: string;
  name_en: string;
  description_uk: string | null;
  description_en: string | null;
  category: ProductCategory;
  size: Size;
  color_mood: ColorMood;
  price_uah_small: number | null;
  price_uah_medium: number | null;
  price_uah_large: number | null;
  price_eur_small: number | null;
  price_eur_medium: number | null;
  price_eur_large: number | null;
  images: string[] | null;
  image_url: string | null;
  is_available: boolean;
  is_featured: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type OrderRow = {
  id: string;
  order_number: number;
  product_id: string | null;
  /** Client-chosen format: small / medium / large */
  product_size: Size | null;
  /** Snapshot of main product image at order time (public or absolute URL). */
  product_image_url: string | null;
  product_name: string;
  price_paid: number;
  currency: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  delivery_type: DeliveryType;
  delivery_date: string | null;
  delivery_time: string | null;
  delivery_address: string | null;
  /** Set when district × time pricing applies (UAH). */
  delivery_fee_uah: number | null;
  /** Non-null when client entered gift card text (UAH add-on). */
  postcard_fee_uah: number | null;
  recipient_phone: string | null;
  gift_message: string | null;
  notes: string | null;
  /** Customer asked not to call; use messengers instead. */
  prefer_messenger_contact: boolean;
  payment_method: PaymentMethod;
  status: OrderStatus;
  liqpay_order_id: string | null;
  paid: boolean;
  confirmed_at: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
};

/** One row: max distance (km) inclusive and price in UAH for storefront hint table. */
export type DeliveryPricingBand = {
  max_km: number;
  price_uah: number;
};

/** Kyiv / Poltava-style zones: fee by approximate delivery window (morning / afternoon / evening). */
export type DeliveryDistrictRow = {
  id: string;
  label_uk: string;
  label_en: string;
  morning_uah: number;
  afternoon_uah: number;
  evening_uah: number;
};

/** Named area + single UAH price (card-style delivery options). */
export type DeliveryNamedZoneRow = {
  id: string;
  label_uk: string;
  label_en: string;
  description_uk?: string;
  description_en?: string;
  price_uah: number;
};

export type DeliveryPricingConfig = {
  bands: DeliveryPricingBand[];
  /** When non-empty, storefront can quote delivery by district + time window (UAH). */
  districts: DeliveryDistrictRow[];
  /** Named zones with flat prices; when set in admin, overrides built-in defaults. */
  zones: DeliveryNamedZoneRow[];
};

export type SiteSettingsRow = {
  id: string;
  working_hours: Record<string, unknown> | null;
  same_day_cutoff_time: string;
  /** Last hour of the same-day delivery window (display / slots), e.g. 19:00. */
  same_day_delivery_end_time: string;
  closed_weekdays: number[];
  pickup_address_uk: string;
  pickup_address_en: string;
  phone: string;
  email: string | null;
  announcement_uk: string | null;
  announcement_en: string | null;
  hero_image_url: string | null;
  about_short_uk: string | null;
  about_short_en: string | null;
  /** Optional distance tiers for delivery fee hints (admin-edited). */
  delivery_pricing: DeliveryPricingConfig | null;
  updated_at: string;
};
