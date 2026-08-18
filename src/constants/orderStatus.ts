import type { OrderStatus } from "../types/order";

// Separado de OrdersTable.tsx porque exportar una constante junto a
// componentes desde el mismo archivo rompe react-refresh/only-export-
// components (mismo motivo por el que AuthContext/CartContext/
// ProductsContext quedan pendientes de separar en otro archivo).
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
