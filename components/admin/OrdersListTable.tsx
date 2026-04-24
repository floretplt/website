"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import Link from "next/link";
import { updateOrderStatus } from "@/lib/actions/admin";
import { ORDER_STATUS_META } from "@/lib/admin/order-status";
import type { DeliveryType, OrderStatus, PaymentMethod } from "@/lib/constants";
import { orderStatusesForDeliveryType } from "@/lib/order-status-policy";
import { voiceDialHref } from "@/lib/phone";
import { Badge, Select } from "@/components/admin/ui";
import { IconPhone } from "@/components/admin/icons";
import { cn } from "@/lib/utils";

export type OrdersListRow = {
  id: string;
  order_number: number;
  product_name: string;
  product_image_url: string | null;
  status: OrderStatus;
  paid: boolean;
  payment_method: PaymentMethod;
  created_at: string;
  customer_phone: string;
  customer_name: string;
  price_paid: number;
  currency: string;
  delivery_type: DeliveryType;
};

export function OrdersListTable({ rows }: { rows: OrdersListRow[] }) {
  const router = useRouter();

  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-200/80 bg-white shadow-sm">
      <table className="w-full min-w-[800px] text-left text-sm">
        <thead className="border-b border-zinc-100 bg-zinc-50/80 text-[11px] font-medium uppercase tracking-wide text-zinc-500">
          <tr>
            <th className="px-4 py-3 pl-6">Фото</th>
            <th className="px-4 py-3">Номер</th>
            <th className="px-4 py-3">Товар</th>
            <th className="px-4 py-3">Тип</th>
            <th className="px-4 py-3">Клієнт</th>
            <th className="px-4 py-3">Сума</th>
            <th className="px-4 py-3">Статус</th>
            <th className="px-4 py-3">Оплата</th>
            <th className="px-4 py-3">Дата</th>
            <th className="w-10 px-4 py-3 pr-6" />
          </tr>
        </thead>
        <tbody>
          {rows.map((o) => (
            <OrderRow key={o.id} order={o} onUpdated={() => router.refresh()} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function OrderRow({
  order: o,
  onUpdated,
}: {
  order: OrdersListRow;
  onUpdated: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const statusOptions = orderStatusesForDeliveryType(o.delivery_type).includes(
    o.status,
  )
    ? orderStatusesForDeliveryType(o.delivery_type)
    : [...orderStatusesForDeliveryType(o.delivery_type), o.status];

  return (
    <tr
      className={cn(
        "border-b border-zinc-100 last:border-0 hover:bg-zinc-50/60",
        pending && "opacity-70",
      )}
    >
      <td className="px-4 py-3 pl-6">
        {o.product_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={o.product_image_url}
            alt=""
            className="h-12 w-12 rounded-lg object-cover ring-1 ring-zinc-200/80"
          />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-zinc-100 text-[10px] text-zinc-400">
            —
          </div>
        )}
      </td>
      <td className="px-4 py-3 font-medium text-zinc-900">#{o.order_number}</td>
      <td className="max-w-[180px] px-4 py-3 text-zinc-700">
        <span className="line-clamp-2">{o.product_name}</span>
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-zinc-600">
        {o.delivery_type === "delivery" ? "Доставка" : "Самовивіз"}
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-zinc-900">{o.customer_name}</span>
          <a
            href={voiceDialHref(o.customer_phone)}
            className="inline-flex items-center gap-1 text-xs text-blue-700 hover:underline"
          >
            <IconPhone size={12} />
            {o.customer_phone}
          </a>
        </div>
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-zinc-700">
        {Math.round(Number(o.price_paid)).toLocaleString("uk-UA")} {o.currency}
      </td>
      <td className="px-4 py-3">
        <Select
          className="min-w-[150px] border-zinc-200 py-2 text-xs font-medium text-zinc-800"
          value={o.status}
          disabled={pending}
          onChange={(e) => {
            const v = e.target.value as OrderStatus;
            startTransition(async () => {
              await updateOrderStatus(o.id, v);
              onUpdated();
            });
          }}
        >
          {statusOptions.map((s) => (
            <option key={s} value={s}>
              {ORDER_STATUS_META[s].label}
            </option>
          ))}
        </Select>
      </td>
      <td className="min-w-[160px] max-w-[200px] px-4 py-3">
        {o.paid ? (
          <Badge tone="emerald">Оплачено</Badge>
        ) : o.payment_method === "reserve" ? (
          <Badge tone="neutral" className="whitespace-normal text-left leading-snug">
            Забронювати — передзвонимо
          </Badge>
        ) : (
          <Badge tone="neutral" className="whitespace-normal text-left leading-snug">
            Оплатити зараз (LiqPay)
          </Badge>
        )}
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-zinc-500">
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
          Деталі →
        </Link>
      </td>
    </tr>
  );
}
