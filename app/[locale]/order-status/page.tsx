import { OrderLookup } from "@/components/shop/OrderLookup";
import type { Locale } from "@/i18n/routing";

export default async function OrderStatusLandingPage({
  params,
}: {
  params: { locale: string };
}) {
  const locale = params.locale as Locale;
  return <OrderLookup locale={locale} />;
}
