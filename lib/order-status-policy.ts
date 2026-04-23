import type { DeliveryType, OrderStatus } from "@/lib/constants";
import { ORDER_STATUSES } from "@/lib/constants";

/** Statuses shown in admin selects (hide «У дорозі» for pickup). */
export function orderStatusesForDeliveryType(
  deliveryType: DeliveryType,
): OrderStatus[] {
  return ORDER_STATUSES.filter(
    (s) => s !== "out_for_delivery" || deliveryType === "delivery",
  );
}

export function assertOrderStatusAllowedForDelivery(
  deliveryType: DeliveryType,
  status: OrderStatus,
) {
  if (status === "out_for_delivery" && deliveryType === "pickup") {
    throw new Error("Статус «У дорозі» недоступний для самовивозу");
  }
}
