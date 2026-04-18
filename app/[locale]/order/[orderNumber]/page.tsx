import { OrderLookup } from "@/components/shop/OrderLookup";
import type { Locale } from "@/i18n/routing";

export default async function OrderStatusPage({
  params,
}: {
  params: { locale: string; orderNumber: string };
}) {
  const locale = params.locale as Locale;
  const orderNumber = Number(params.orderNumber);
  if (Number.isNaN(orderNumber)) {
    return null;
  }

  return <OrderLookup locale={locale} initialOrderNumber={orderNumber} />;
}
