import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth";
import Link from "next/link";
import { Badge, Card, CardBody, CardHeader, EmptyState, PageHeader } from "@/components/admin/ui";
import {
  IconInbox,
  IconOrders,
  IconTrendUp,
} from "@/components/admin/icons";
import { ORDER_STATUS_META } from "@/lib/admin/order-status";
import type { OrderStatus } from "@/lib/constants";

export default async function AdminDashboardPage() {
  await requireAdmin();
  const admin = createAdminClient();

  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const { count: todayOrders } = await admin
    .from("orders")
    .select("*", { count: "exact", head: true })
    .gte("created_at", start.toISOString());

  const { count: pending } = await admin
    .from("orders")
    .select("*", { count: "exact", head: true })
    .eq("status", "new");

  const { data: paidWeek } = await admin
    .from("orders")
    .select("price_paid, currency")
    .eq("paid", true)
    .gte("created_at", weekAgo.toISOString());

  const weekTotalUah =
    paidWeek?.filter((o) => o.currency === "UAH").reduce((s, o) => s + Number(o.price_paid), 0) ??
    0;

  const { data: recent } = await admin
    .from("orders")
    .select("id, order_number, product_name, status, created_at, paid, customer_name")
    .order("created_at", { ascending: false })
    .limit(8);

  const stats = [
    {
      label: "Замовлень сьогодні",
      value: todayOrders ?? 0,
      icon: <IconOrders size={18} />,
      tint: "bg-blue-50 text-blue-700",
    },
    {
      label: "Нових (неопрацьовано)",
      value: pending ?? 0,
      icon: <IconInbox size={18} />,
      tint: "bg-amber-50 text-amber-700",
    },
    {
      label: "Тиждень, оплачено",
      value: `${Math.round(weekTotalUah).toLocaleString("uk-UA")} ₴`,
      icon: <IconTrendUp size={18} />,
      tint: "bg-emerald-50 text-emerald-700",
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Огляд"
        description="Коротка зведена інформація по магазину."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardBody className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                  {s.label}
                </p>
                <p className="text-2xl font-semibold tracking-tight text-zinc-900">
                  {s.value}
                </p>
              </div>
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-lg ${s.tint}`}
              >
                {s.icon}
              </span>
            </CardBody>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader
          title="Останні замовлення"
          description="Найновіші вісім замовлень — клік для деталей."
          actions={
            <Link
              href="/admin/orders"
              className="text-xs font-medium text-zinc-600 hover:text-zinc-900"
            >
              Усі замовлення →
            </Link>
          }
        />
        {(recent ?? []).length === 0 ? (
          <EmptyState
            icon={<IconInbox size={18} />}
            title="Ще немає замовлень"
            description="Щойно прийде перше замовлення, воно з'явиться тут."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-100 bg-zinc-50/60 text-[11px] font-medium uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className="px-6 py-3">Номер</th>
                  <th className="px-6 py-3">Товар</th>
                  <th className="px-6 py-3">Клієнт</th>
                  <th className="px-6 py-3">Статус</th>
                  <th className="px-6 py-3">Оплата</th>
                  <th className="px-6 py-3">Дата</th>
                  <th className="w-10 px-6 py-3" />
                </tr>
              </thead>
              <tbody>
                {(recent ?? []).map((o) => {
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
                      <td className="px-6 py-3 text-zinc-700">{o.product_name}</td>
                      <td className="px-6 py-3 text-zinc-600">
                        {o.customer_name}
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
                      <td className="px-6 py-3 text-zinc-500">
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
                          Відкрити
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
