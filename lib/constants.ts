export const PRODUCT_CATEGORIES = [
  "bouquets",
  "box-bouquets",
  "wedding",
  "decor",
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

/** Categories with a public product grid (`/catalog/...`). Excludes decor and wedding. */
export const CATALOG_BROWSE_CATEGORIES = ["bouquets", "box-bouquets"] as const;

export const SIZES = ["small", "medium", "large"] as const;
export type Size = (typeof SIZES)[number];

export const COLOR_MOODS = ["pink", "blue", "yellow", "red", "white", "bright"] as const;
export type ColorMood = (typeof COLOR_MOODS)[number];

export const ORDER_STATUSES = ["new", "confirmed", "done", "cancelled"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAYMENT_METHODS = ["prepay", "reserve"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const DELIVERY_TYPES = ["pickup", "delivery"] as const;
export type DeliveryType = (typeof DELIVERY_TYPES)[number];
