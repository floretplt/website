import { OrderLookup } from "@/components/shop/OrderLookup";
import { createAdminClient } from "@/lib/supabase/admin";

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

  let paidInDb = false;
  const admin = createAdminClient();
  const { data } = await admin
    .from("orders")
    .select("paid")
    .eq("order_number", orderNumber)
    .maybeSingle();
  if (data && (data as { paid: boolean }).paid === true) {
    paidInDb = true;
  }

  const paidThanks = thanks && paidInDb;

  return (
    <OrderLookup
      initialOrderNumber={orderNumber}
      initialThanks={thanks}
      initialPaidThanks={paidThanks}
    />
  );
}
