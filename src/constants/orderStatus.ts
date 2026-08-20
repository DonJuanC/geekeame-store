import type { OrderStatus } from "../types/order";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pendiente",
  processing: "En proceso",
  completed: "Completado",
  cancelled: "Cancelado",
};

export const ORDER_STATUS_OPTIONS: OrderStatus[] = [
  "pending",
  "processing",
  "completed",
  "cancelled",
];
