export type OrderStatus = "pending" | "processing" | "completed" | "cancelled";

export interface OrderItemSnapshot {
  productId: string;
  name: string;
  priceAtPurchase: number;
  quantity: number;
}

export interface Order {
  id: string;
  userId: string;
  items: OrderItemSnapshot[];
  total: number;
  status: OrderStatus;
  createdAt: number;
  updatedAt?: number;
}
