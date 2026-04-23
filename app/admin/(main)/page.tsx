import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth";
import Link from "next/link";
import {
  Badge,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  PageHeader,
} from "@/components/admin/ui";
import {
  IconCalendar,
  IconInbox,
  IconOrders,
  IconPhone,
  IconTrendUp,
} from "@/components/admin/icons";
import { ORDER_STATUS_META } from "@/lib/admin/order-status";
import type { OrderStatus } from "@/lib/constants";
import { kyivCalendarDateString } from "@/lib/delivery-kyiv";
import { voiceDialHref } from "@/lib/phone";

export default async function AdminDashboardPage() {
  await requireAdmin();
  const admin = createAdminClient();

  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const todayKyiv = kyivCalendarDateString();

  const { count: todayOrders } = await admin
    .from("orders")
    .select("*", { count: "exact", head: true })
    .gte("created_at", start.toISOString());

  const { count: pending } = await admin
    .from("orders")
    .select("*", { count: "exact", head: true })
    .eq("status", "new");

  const { count: unpaidActive } = await admin
    .from("orders")
    .select("*", { count: "exact", head: true })
    .eq("paid", false)
    .neq("status", "completed")
    .neq("status", "cancelled");

  const { count: todayDelivery } = await admin
    .from("orders")
    .select("*", { count: "exact", head: true })
    .eq("delivery_date", todayKyiv)
    .eq("delivery_type", "delivery");

  const { count: todayPickup } = await admin
    .from("orders")
    .select("*", { count: "exact", head: true })
    .eq("delivery_date", todayKyiv)
    .eq("delivery_type", "pickup");

  const { data: paidWeek } = await admin
    .from("orders")
    .select("price_paid, currency")
    .eq("paid", true)
    .gte("created_at", weekAgo.toISOString());

  const weekTotalUah =
    paidWeek
      ?.filter((o) => o.currency === "UAH")
      .reduce((s, o) => s + Number(o.price_paid), 0) ?? 0;

  const { data: recent } = await admin
    .from("orders")
    .select(
      "id, order_number, product_name, product_image_url, status, created_at, paid, customer_name, customer_phone, delivery_type",
    )
    .order("created_at", { ascending: false })
    .limit(8);

  const stats = [
    {
      label: "Замовлень сьогодні",
      value: String(todayOrders ?? 0),
      icon: <IconOrders size={18} />,
      tint: "bg-blue-50 text-blue-700",
    },
    {
      label: "Нових (неопрацьовано)",
      value: String(pending ?? 0),
      icon: <IconInbox size={18} />,
      tint: "bg-amber-50 text-amber-700",
    },
    {
      label: "Неоплачені активні",
      value: String(unpaidActive ?? 0),
      icon: <IconInbox size={18} />,
      tint: "bg-orange-50 text-orange-800",
    },
    {
      label: "Сьогодні за датою (Київ)",
      value: `${todayDelivery ?? 0} доставка · ${todayPickup ?? 0} самовивіз`,
      icon: <IconCalendar size={18} />,
      tint: "bg-violet-50 text-violet-800",
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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardBody className="flex items-start justify-between gap-4">
              <div className="min-w-0 space-y-2">
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                  {s.label}
                </p>
                <p className="text-xl font-semibold tracking-tight text-zinc-900 sm:text-2xl">
                  {s.value}
                </p>
              </div>
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${s.tint}`}
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
                  <th className="px-4 py-3 pl-6">Фото</th>
                  <th className="px-4 py-3">Номер</th>
                  <th className="px-4 py-3">Товар</th>
                  <th className="px-4 py-3">Тип</th>
                  <th className="px-4 py-3">Клієнт</th>
                  <th className="px-4 py-3">Статус</th>
                  <th className="px-4 py-3">Оплата</th>
                  <th className="px-4 py-3">Дата</th>
                  <th className="w-10 px-4 py-3 pr-6" />
                </tr>
              </thead>
              <tbody>
                {(recent ?? []).map((o) => {
                  const meta =
                    ORDER_STATUS_META[o.status as OrderStatus] ??
                    ORDER_STATUS_META.new;
                  const img = (o as { product_image_url?: string | null })
                    .product_image_url;
                  const dt = (o as { delivery_type?: string }).delivery_type;
                  return (
                    <tr
                      key={o.id}
                      className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50/60"
                    >
                      <td className="px-4 py-3 pl-6">
                        {img ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={img}
                            alt=""
                            className="h-9 w-9 rounded-md object-cover ring-1 ring-zinc-200"
                          />
                        ) : (
                          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-zinc-100 text-[9px] text-zinc-400">
                            —
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium text-zinc-900">
                        #{o.order_number}
                      </td>
                      <td className="max-w-[160px] px-4 py-3 text-zinc-700">
                        <span className="line-clamp-2">{o.product_name}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-zinc-600">
                        {dt === "delivery" ? "Доставка" : "Самовивіз"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-zinc-600">{o.customer_name}</span>
                          <a
                            href={voiceDialHref(
                              (o as { customer_phone: string }).customer_phone,
                            )}
                            className="inline-flex items-center gap-1 text-xs text-blue-700 hover:underline"
                          >
                            <IconPhone size={12} />
                            {(o as { customer_phone: string }).customer_phone}
                          </a>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={meta.tone}>{meta.label}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        {o.paid ? (
                          <Badge tone="emerald">Оплачено</Badge>
                        ) : (
                          <Badge tone="neutral">
                            Зв&apos;яжіться з клієнтом
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-zinc-500">
                        {new Date(o.created_at).toLocaleString("uk-UA", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-4 py-3 pr-6 text-right">
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
