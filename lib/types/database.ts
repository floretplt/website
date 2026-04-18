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
  recipient_phone: string | null;
  gift_message: string | null;
  notes: string | null;
  payment_method: PaymentMethod;
  status: OrderStatus;
  liqpay_order_id: string | null;
  paid: boolean;
  confirmed_at: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
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
  updated_at: string;
};
