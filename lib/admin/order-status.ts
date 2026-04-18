import type { OrderStatus } from "@/lib/constants";

/** Ukrainian labels + badge tone for order statuses. */
export const ORDER_STATUS_META: Record<
  OrderStatus,
  { label: string; tone: "amber" | "blue" | "emerald" | "rose" | "neutral" }
> = {
  new: { label: "Нове", tone: "amber" },
  confirmed: { label: "Підтверджено", tone: "blue" },
  done: { label: "Виконано", tone: "emerald" },
  cancelled: { label: "Скасовано", tone: "rose" },
};
