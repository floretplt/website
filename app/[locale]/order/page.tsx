import { OrderForm } from "@/components/shop/OrderForm";
import type { Locale } from "@/i18n/routing";
import { getProductBySlug } from "@/lib/data/products";
import type { ProductCategory, Size } from "@/lib/constants";
import { PRODUCT_CATEGORIES, SIZES } from "@/lib/constants";
import { getSiteSettings } from "@/lib/data/settings";
import { getEffectiveNamedZones } from "@/lib/default-delivery-zones";
import { parseDeliveryPricingConfig } from "@/lib/delivery-pricing";
import {
  kyivCalendarDateString,
  minDeliveryDateAfterOrderCutoff,
} from "@/lib/delivery-kyiv";

function parseProductSize(
  v: string | undefined,
): Size | undefined {
  if (!v) return undefined;
  return SIZES.includes(v as Size) ? (v as Size) : undefined;
}

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: { locale: string };
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const locale = params.locale as Locale;
  const slug =
    typeof searchParams.product === "string" ? searchParams.product : null;
  const cat =
    typeof searchParams.category === "string" ? searchParams.category : null;
  const defaultProductSize = parseProductSize(
    typeof searchParams.size === "string" ? searchParams.size : undefined,
  );

  let product = null;
  if (
    slug &&
    cat &&
    PRODUCT_CATEGORIES.includes(cat as ProductCategory) &&
    cat !== "decor"
  ) {
    product = await getProductBySlug(cat as ProductCategory, slug);
  }

  const settings = await getSiteSettings();
  const deliveryPricing = parseDeliveryPricingConfig(
    settings.delivery_pricing ?? {},
  );
  const namedZones = getEffectiveNamedZones(deliveryPricing);
  const cutoffStr = settings.same_day_cutoff_time.slice(0, 5);
  const minDeliveryDate = minDeliveryDateAfterOrderCutoff(cutoffStr);
  const minPickupDate = kyivCalendarDateString();
  const deliveryEndStr = settings.same_day_delivery_end_time.slice(0, 5);

  return (
    <OrderForm
      locale={locale}
      initialProduct={product}
      defaultProductSize={defaultProductSize}
      minDeliveryDate={minDeliveryDate}
      minPickupDate={minPickupDate}
      sameDayOrderCutoff={cutoffStr}
      sameDayDeliveryEnd={deliveryEndStr}
      deliveryBands={deliveryPricing.bands ?? []}
      deliveryDistricts={deliveryPricing.districts ?? []}
      namedZones={namedZones}
    />
  );
}
