import { OrderLookup } from "@/components/shop/OrderLookup";

export default async function OrderStatusPage({
  params,
  searchParams,
}: {
  params: { locale: string; orderNumber: string };
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const orderNumber = Number(params.orderNumber);
  if (Number.isNaN(orderNumber)) {
    return null;
  }

  const thanksRaw = searchParams.thanks;
  const thanks =
    thanksRaw === "1" ||
    thanksRaw === "true" ||
    (Array.isArray(thanksRaw) && thanksRaw.includes("1"));

  return (
    <OrderLookup initialOrderNumber={orderNumber} initialThanks={thanks} />
  );
}
