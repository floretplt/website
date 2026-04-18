import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  Badge,
  Card,
  EmptyState,
  PageHeader,
} from "@/components/admin/ui";
import { IconInbox, IconPhone } from "@/components/admin/icons";
import { ORDER_STATUS_META } from "@/lib/admin/order-status";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/constants";

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
      "id, order_number, product_name, status, paid, created_at, customer_phone, customer_name, price_paid, currency",
    )
    .order("created_at", { ascending: false });

  if (selected !== "all") {
    builder = builder.eq("status", selected);
  }

  const { data: orders } = await builder;
  const rows = orders ?? [];

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
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-100 bg-zinc-50/60 text-[11px] font-medium uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className="px-6 py-3">Номер</th>
                  <th className="px-6 py-3">Товар</th>
                  <th className="px-6 py-3">Клієнт</th>
                  <th className="px-6 py-3">Сума</th>
                  <th className="px-6 py-3">Статус</th>
                  <th className="px-6 py-3">Оплата</th>
                  <th className="px-6 py-3">Дата</th>
                  <th className="w-10 px-6 py-3" />
                </tr>
              </thead>
              <tbody>
                {rows.map((o) => {
                  const meta =
                    ORDER_STATUS_META[o.status as OrderStatus] ??
                    ORDER_STATUS_META.new;
                  return (
                    <tr
                      key={o.id}
                      className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50/60"
                    >
                      <td className="px-6 py-3 font-medium text-zinc-900">
                        #{o.order_number}
                      </td>
                      <td className="px-6 py-3 text-zinc-700">
                        {o.product_name}
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-zinc-900">
                            {o.customer_name}
                          </span>
                          <span className="inline-flex items-center gap-1 text-xs text-zinc-500">
                            <IconPhone size={12} />
                            {o.customer_phone}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-zinc-700">
                        {Math.round(Number(o.price_paid)).toLocaleString("uk-UA")}{" "}
                        {o.currency}
                      </td>
                      <td className="px-6 py-3">
                        <Badge tone={meta.tone}>{meta.label}</Badge>
                      </td>
                      <td className="px-6 py-3">
                        {o.paid ? (
                          <Badge tone="emerald">Оплачено</Badge>
                        ) : (
                          <Badge tone="neutral">Очікує</Badge>
                        )}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-zinc-500">
                        {new Date(o.created_at).toLocaleString("uk-UA", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-6 py-3 text-right">
                        <Link
                          href={`/admin/orders/${o.id}`}
                          className="text-xs font-medium text-zinc-600 hover:text-zinc-900"
                        >
                          Деталі →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
