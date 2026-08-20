import type { Order } from "../types/order";
import type { Product } from "../types/product";

export interface OrdersByStatus {
  pending: number;
  processing: number;
  completed: number;
  cancelled: number;
}

export function computeOrdersByStatus(orders: Order[]): OrdersByStatus {
  const counts: OrdersByStatus = {
    pending: 0,
    processing: 0,
    completed: 0,
    cancelled: 0,
  };
  for (const order of orders) {
    counts[order.status] += 1;
  }
  return counts;
}

export interface RevenueSummary {
  totalRevenue: number;
  completedCount: number;
  averageOrderValue: number;
}

export function computeRevenueSummary(orders: Order[]): RevenueSummary {
  const completed = orders.filter(
    (o): o is Order & { status: "completed" } => o.status === "completed",
  );
  const totalRevenue = completed.reduce((sum, o) => sum + o.total, 0);
  const completedCount = completed.length;
  return {
    totalRevenue,
    completedCount,
    averageOrderValue: completedCount > 0 ? totalRevenue / completedCount : 0,
  };
}

export interface TopProduct {
  productId: string;
  name: string;
  quantity: number;
  revenue: number;
}

export function computeTopProducts(orders: Order[], topN = 5): TopProduct[] {
  const byProduct = new Map<string, TopProduct>();
  for (const order of orders) {
    if (order.status !== "completed") continue;
    for (const item of order.items) {
      const existing = byProduct.get(item.productId);
      const revenue = item.priceAtPurchase * item.quantity;
      if (existing) {
        existing.quantity += item.quantity;
        existing.revenue += revenue;
      } else {
        byProduct.set(item.productId, {
          productId: item.productId,
          name: item.name,
          quantity: item.quantity,
          revenue,
        });
      }
    }
  }
  return Array.from(byProduct.values())
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, topN);
}

export interface DailySales {
  date: string; // YYYY-MM-DD
  orders: number;
  revenue: number;
}

export function computeDailySales(orders: Order[], days = 7): DailySales[] {
  const now = orders.reduce((max, o) => Math.max(max, o.createdAt), 0);
  const anchor = now > 0 ? now : Date.now();

  const buckets = new Map<string, DailySales>();
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(anchor - i * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);
    buckets.set(date, { date, orders: 0, revenue: 0 });
  }

  for (const order of orders) {
    if (order.status !== "completed") continue;
    const date = new Date(order.createdAt).toISOString().slice(0, 10);
    const bucket = buckets.get(date);
    if (!bucket) continue;
    bucket.orders += 1;
    bucket.revenue += order.total;
  }

  return Array.from(buckets.values());
}

export function computeLowStock(
  products: Product[],
  threshold = 3,
): Product[] {
  return products
    .filter((p) => p.stock <= threshold)
    .sort((a, b) => a.stock - b.stock);
}
