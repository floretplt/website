import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Card, EmptyState, PageHeader } from "@/components/admin/ui";
import { IconInbox } from "@/components/admin/icons";
import { ORDER_STATUS_META } from "@/lib/admin/order-status";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/constants";
import { OrdersListTable } from "@/components/admin/OrdersListTable";
import type { DeliveryType, PaymentMethod } from "@/lib/constants";

const TABS: { value: "all" | OrderStatus; label: string }[] = [
  { value: "all", label: "Усі" },
  ...ORDER_STATUSES.map((s) => ({ value: s, label: ORDER_STATUS_META[s].label })),
];

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  await requireAdmin();
  const admin = createAdminClient();
  const statusParam =
    typeof searchParams.status === "string" ? searchParams.status : undefined;
  const selected =
    statusParam && (ORDER_STATUSES as readonly string[]).includes(statusParam)
      ? (statusParam as OrderStatus)
      : ("all" as const);

  let builder = admin
    .from("orders")
    .select(
      "id, order_number, product_name, product_image_url, status, paid, payment_method, created_at, customer_phone, customer_name, price_paid, currency, delivery_type",
    )
    .order("created_at", { ascending: false });

  if (selected !== "all") {
    builder = builder.eq("status", selected);
  }

  const { data: orders } = await builder;
  const rows =
    (orders ?? []).map((o) => ({
      ...o,
      delivery_type: o.delivery_type as DeliveryType,
      status: o.status as OrderStatus,
      product_image_url: (o as { product_image_url?: string | null })
        .product_image_url ?? null,
      payment_method: ((o as { payment_method?: string }).payment_method ??
        "reserve") as PaymentMethod,
    })) ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Замовлення"
        description={`Усього: ${rows.length}`}
      />

      <div className="flex flex-wrap items-center gap-1 rounded-lg border border-zinc-200 bg-white p-1">
        {TABS.map((t) => {
          const isActive = selected === t.value;
          const href =
            t.value === "all"
              ? "/admin/orders"
              : `/admin/orders?status=${t.value}`;
          return (
            <Link
              key={t.value}
              href={href}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                isActive
                  ? "bg-zinc-900 text-white shadow-sm"
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900",
              )}
            >
              {t.label}
            </Link>
          );
        })}
      </div>

      <Card>
        {rows.length === 0 ? (
          <EmptyState
            icon={<IconInbox size={18} />}
            title={
              selected === "all"
                ? "Ще немає замовлень"
                : "У цій категорії порожньо"
            }
            description="Спробуйте інший фільтр або зачекайте на нові замовлення."
          />
        ) : (
          <OrdersListTable rows={rows} />
        )}
      </Card>
    </div>
  );
}
