"use client";

import { useState } from "react";
import {
  updateOrderNotes,
  updateOrderPaid,
  updateOrderStatus,
} from "@/lib/actions/admin";
import type { DeliveryType, OrderStatus } from "@/lib/constants";
import { ORDER_STATUS_META } from "@/lib/admin/order-status";
import { orderStatusesForDeliveryType } from "@/lib/order-status-policy";
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  Field,
  Select,
  Switch,
  Textarea,
} from "./ui";
import { IconCopy } from "./icons";

type Order = {
  id: string;
  order_number: number;
  status: OrderStatus;
  paid: boolean;
  admin_notes: string | null;
  product_name: string;
  price_paid: number;
  delivery_fee_uah?: number | null;
  postcard_fee_uah?: number | null;
  currency: string;
  customer_name: string;
  customer_phone: string;
  delivery_type: DeliveryType;
  delivery_date: string | null;
  delivery_time: string | null;
  delivery_address: string | null;
  recipient_phone: string | null;
  gift_message: string | null;
  notes: string | null;
  payment_method: string;
  product_size: string | null;
};

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[120px_1fr] items-start gap-3 py-2">
      <dt className="text-xs uppercase tracking-wide text-zinc-500">{label}</dt>
      <dd className="text-sm text-zinc-800">{children}</dd>
    </div>
  );
}

export function OrderDetailForm({ order }: { order: Order }) {
  const [status, setStatus] = useState(order.status);
  const [paid, setPaid] = useState(order.paid);
  const [notes, setNotes] = useState(order.admin_notes ?? "");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const meta = ORDER_STATUS_META[status] ?? ORDER_STATUS_META.new;
  const statusSelectOptions = orderStatusesForDeliveryType(
    order.delivery_type,
  ).includes(status)
    ? orderStatusesForDeliveryType(order.delivery_type)
    : [...orderStatusesForDeliveryType(order.delivery_type), status];

  const copyLiqPay = async () => {
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch("/api/liqpay/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id }),
      });
      const json = await res.json();
      if (!res.ok) {
        setMsg(json.error ?? "Помилка");
        return;
      }
      const url = json.checkoutUrl;
      const form = `data=${encodeURIComponent(json.data)}&signature=${encodeURIComponent(json.signature)}`;
      await navigator.clipboard.writeText(
        `POST ${url} (form: ${form.slice(0, 80)}...)`,
      );
      setMsg("Скопійовано чернетку — надішліть клієнту посилання.");
    } catch {
      setMsg("Помилка");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        <Card>
          <CardHeader
            title={
              <span className="flex items-center gap-2">
                <span className="text-base font-semibold text-zinc-900">
                  #{order.order_number}
                </span>
                <Badge tone={meta.tone}>{meta.label}</Badge>
                {paid ? (
                  <Badge tone="emerald">Оплачено</Badge>
                ) : (
                  <Badge tone="neutral">Зв&apos;яжіться з клієнтом</Badge>
                )}
              </span>
            }
            description={order.product_name}
          />
          <CardBody>
            <dl className="divide-y divide-zinc-100">
              <Row label="Букет">
                <span className="font-medium text-zinc-900">
                  {Math.round(Number(order.price_paid)).toLocaleString("uk-UA")}{" "}
                  {order.currency}
                </span>
              </Row>
              {order.delivery_fee_uah != null &&
              Number(order.delivery_fee_uah) > 0 ? (
                <Row label="Доставка (UAH)">
                  <span className="font-medium text-zinc-900">
                    {Math.round(Number(order.delivery_fee_uah)).toLocaleString("uk-UA")}{" "}
                    UAH
                  </span>
                </Row>
              ) : null}
              {order.postcard_fee_uah != null &&
              Number(order.postcard_fee_uah) > 0 ? (
                <Row label="Листівка (UAH)">
                  <span className="font-medium text-zinc-900">
                    {Math.round(Number(order.postcard_fee_uah)).toLocaleString("uk-UA")}{" "}
                    UAH
                  </span>
                </Row>
              ) : null}
              {order.currency === "UAH" &&
              ((order.delivery_fee_uah != null &&
                Number(order.delivery_fee_uah) > 0) ||
                (order.postcard_fee_uah != null &&
                  Number(order.postcard_fee_uah) > 0)) ? (
                <Row label="Разом до сплати">
                  <span className="font-semibold text-zinc-900">
                    {Math.round(
                      Number(order.price_paid) +
                        Number(order.delivery_fee_uah ?? 0) +
                        Number(order.postcard_fee_uah ?? 0),
                    ).toLocaleString("uk-UA")}{" "}
                    UAH
                  </span>
                </Row>
              ) : null}
              {order.product_size ? (
                <Row label="Розмір">{order.product_size}</Row>
              ) : null}
              <Row label="Клієнт">
                <div className="flex flex-col gap-0.5">
                  <span>{order.customer_name}</span>
                  <a
                    href={`tel:${order.customer_phone}`}
                    className="text-zinc-600 underline-offset-2 hover:underline"
                  >
                    {order.customer_phone}
                  </a>
                </div>
              </Row>
              <Row label="Доставка">
                {order.delivery_type === "delivery" ? (
                  <div className="space-y-1">
                    <span className="inline-block rounded-md bg-zinc-100 px-2 py-0.5 text-xs text-zinc-700">
                      Кур&apos;єр
                    </span>
                    <div className="whitespace-pre-wrap text-zinc-700">
                      {[order.delivery_date, order.delivery_time]
                        .filter(Boolean)
                        .join(" ")}
                    </div>
                    {order.delivery_address ? (
                      <div className="text-zinc-700">{order.delivery_address}</div>
                    ) : null}
                    {order.recipient_phone ? (
                      <div className="text-zinc-500">
                        Отримувач: {order.recipient_phone}
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <div className="space-y-1">
                    <span className="inline-block rounded-md bg-zinc-100 px-2 py-0.5 text-xs text-zinc-700">
                      Самовивіз
                    </span>
                    <div className="whitespace-pre-wrap text-zinc-700">
                      {[order.delivery_date, order.delivery_time]
                        .filter(Boolean)
                        .join(" ")}
                    </div>
                  </div>
                )}
              </Row>
              <Row label="Оплата">
                {order.payment_method === "prepay"
                  ? "Онлайн (LiqPay)"
                  : "Резерв / оплата при отриманні"}
              </Row>
              {order.gift_message ? (
                <Row label="Листівка">
                  <span className="whitespace-pre-wrap italic text-zinc-700">
                    «{order.gift_message}»
                  </span>
                </Row>
              ) : null}
              {order.notes ? (
                <Row label="Нотатки клієнта">
                  <span className="whitespace-pre-wrap text-zinc-700">
                    {order.notes}
                  </span>
                </Row>
              ) : null}
            </dl>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Адмін-нотатки"
            description="Приватні коментарі — клієнт їх не бачить."
          />
          <CardBody>
            <Field
              hint={
                <span className="text-zinc-400">
                  Автоматично зберігається при втраті фокусу.
                </span>
              }
            >
              <Textarea
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                onBlur={async () => {
                  await updateOrderNotes(order.id, notes);
                }}
                placeholder="Напр.: зв'язатись з клієнтом, уточнити час…"
              />
            </Field>
          </CardBody>
        </Card>
      </div>

      <div className="space-y-6 lg:sticky lg:top-6 lg:self-start">
        <Card>
          <CardHeader title="Управління" />
          <CardBody className="space-y-5">
            <Field label="Статус">
              <Select
                value={status}
                onChange={async (e) => {
                  const v = e.target.value as OrderStatus;
                  setStatus(v);
                  await updateOrderStatus(order.id, v);
                }}
              >
                {statusSelectOptions.map((s) => (
                  <option key={s} value={s}>
                    {ORDER_STATUS_META[s].label}
                  </option>
                ))}
              </Select>
            </Field>

            <div className="flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50/60 px-3 py-2">
              <div>
                <p className="text-sm font-medium text-zinc-800">Оплачено</p>
                <p className="text-xs text-zinc-500">
                  Позначити оплату вручну.
                </p>
              </div>
              <Switch
                checked={paid}
                onChange={async (v) => {
                  setPaid(v);
                  await updateOrderPaid(order.id, v);
                }}
              />
            </div>

            {order.payment_method === "prepay" && !paid ? (
              <Button
                variant="secondary"
                onClick={copyLiqPay}
                disabled={loading}
                className="w-full"
              >
                <IconCopy size={14} />
                {loading ? "Готуємо…" : "Скопіювати LiqPay"}
              </Button>
            ) : null}

            {msg ? (
              <p className="rounded-md bg-zinc-50 px-3 py-2 text-xs text-zinc-600">
                {msg}
              </p>
            ) : null}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
