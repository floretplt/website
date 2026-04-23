import type { DeliveryType, OrderStatus } from "@/lib/constants";

/** Map Telegram callback letter → next status if transition is allowed. */
export function resolveOrderStatusAfterTelegramAction(
  current: OrderStatus,
  deliveryType: DeliveryType,
  code: string,
): OrderStatus | null {
  if (code === "p" && current === "new") return "in_progress";
  if (code === "r" && current === "in_progress") return "ready";
  if (code === "o" && current === "ready" && deliveryType === "delivery") {
    return "out_for_delivery";
  }
  if (code === "c") {
    if (current === "ready" || current === "out_for_delivery") {
      return "completed";
    }
  }
  return null;
}
