import type { OrderStatus } from "@/lib/constants";

/** Ukrainian labels + badge tone for order statuses. */
export const ORDER_STATUS_META: Record<
  OrderStatus,
  { label: string; tone: "amber" | "blue" | "emerald" | "rose" | "violet" | "neutral" }
> = {
  new: { label: "Нове", tone: "amber" },
  in_progress: { label: "У роботі", tone: "blue" },
  ready: { label: "Готово", tone: "violet" },
  out_for_delivery: { label: "У дорозі", tone: "blue" },
  completed: { label: "Завершено", tone: "emerald" },
  cancelled: { label: "Скасовано", tone: "rose" },
};
