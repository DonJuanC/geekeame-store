import { describe, expect, it } from "vitest";
import {
  computeDailySales,
  computeLowStock,
  computeOrdersByStatus,
  computeRevenueSummary,
  computeTopProducts,
} from "./analyticsService";
import type { Order } from "../types/order";
import type { Product } from "../types/product";
import { productFixture } from "../test/fixtures";

const DAY = 24 * 60 * 60 * 1000;
const BASE_TS = 1_700_000_000_000; // fijo, para que los tests sean deterministas

function orderFixture(overrides: Partial<Order> = {}): Order {
  return {
    id: "o_1",
    userId: "u_1",
    items: [
      { productId: "p_1", name: "Pin Geek", priceAtPurchase: 15000, quantity: 2 },
    ],
    total: 30000,
    status: "completed",
    createdAt: BASE_TS,
    ...overrides,
  };
}

describe("computeOrdersByStatus", () => {
  it("cuenta cada estado por separado", () => {
    const orders = [
      orderFixture({ status: "pending" }),
      orderFixture({ status: "pending" }),
      orderFixture({ status: "completed" }),
      orderFixture({ status: "cancelled" }),
    ];
    expect(computeOrdersByStatus(orders)).toEqual({
      pending: 2,
      processing: 0,
      completed: 1,
      cancelled: 1,
    });
  });

  it("devuelve todo en cero sin órdenes", () => {
    expect(computeOrdersByStatus([])).toEqual({
      pending: 0,
      processing: 0,
      completed: 0,
      cancelled: 0,
    });
  });
});

describe("computeRevenueSummary", () => {
  it("solo suma órdenes completed", () => {
    const orders = [
      orderFixture({ status: "completed", total: 30000 }),
      orderFixture({ status: "completed", total: 10000 }),
      orderFixture({ status: "pending", total: 999999 }),
      orderFixture({ status: "cancelled", total: 999999 }),
    ];
    expect(computeRevenueSummary(orders)).toEqual({
      totalRevenue: 40000,
      completedCount: 2,
      averageOrderValue: 20000,
    });
  });

  it("averageOrderValue es 0 sin órdenes completed (evita dividir por cero)", () => {
    const orders = [orderFixture({ status: "pending" })];
    expect(computeRevenueSummary(orders).averageOrderValue).toBe(0);
  });
});

describe("computeTopProducts", () => {
  it("suma cantidades del mismo producto entre órdenes y ordena descendente", () => {
    const orders = [
      orderFixture({
        status: "completed",
        items: [
          { productId: "p_1", name: "Pin A", priceAtPurchase: 10000, quantity: 1 },
        ],
      }),
      orderFixture({
        status: "completed",
        items: [
          { productId: "p_1", name: "Pin A", priceAtPurchase: 10000, quantity: 2 },
          { productId: "p_2", name: "Pin B", priceAtPurchase: 5000, quantity: 5 },
        ],
      }),
    ];
    const result = computeTopProducts(orders);
    expect(result[0]).toEqual({
      productId: "p_2",
      name: "Pin B",
      quantity: 5,
      revenue: 25000,
    });
    expect(result[1]).toEqual({
      productId: "p_1",
      name: "Pin A",
      quantity: 3,
      revenue: 30000,
    });
  });

  it("ignora órdenes que no están completed", () => {
    const orders = [
      orderFixture({
        status: "pending",
        items: [
          { productId: "p_1", name: "Pin A", priceAtPurchase: 10000, quantity: 99 },
        ],
      }),
    ];
    expect(computeTopProducts(orders)).toEqual([]);
  });

  it("respeta el límite topN", () => {
    const orders = [
      orderFixture({
        status: "completed",
        items: [
          { productId: "p_1", name: "A", priceAtPurchase: 1000, quantity: 3 },
          { productId: "p_2", name: "B", priceAtPurchase: 1000, quantity: 2 },
          { productId: "p_3", name: "C", priceAtPurchase: 1000, quantity: 1 },
        ],
      }),
    ];
    expect(computeTopProducts(orders, 2)).toHaveLength(2);
  });
});

describe("computeDailySales", () => {
  it("agrupa por día solo las órdenes completed dentro de la ventana", () => {
    const orders = [
      orderFixture({ status: "completed", total: 10000, createdAt: BASE_TS }),
      orderFixture({ status: "completed", total: 5000, createdAt: BASE_TS }),
      orderFixture({ status: "completed", total: 7000, createdAt: BASE_TS - DAY }),
      orderFixture({ status: "pending", total: 999999, createdAt: BASE_TS }),
      // fuera de la ventana de 7 días
      orderFixture({ status: "completed", total: 1, createdAt: BASE_TS - 30 * DAY }),
    ];
    const result = computeDailySales(orders, 7);
    expect(result).toHaveLength(7);
    const today = result[result.length - 1];
    const yesterday = result[result.length - 2];
    expect(today.orders).toBe(2);
    expect(today.revenue).toBe(15000);
    expect(yesterday.orders).toBe(1);
    expect(yesterday.revenue).toBe(7000);
  });

  it("sin órdenes devuelve la ventana completa en cero", () => {
    const result = computeDailySales([], 7);
    expect(result).toHaveLength(7);
    expect(result.every((d) => d.orders === 0 && d.revenue === 0)).toBe(true);
  });
});

describe("computeLowStock", () => {
  it("filtra por debajo o igual al umbral y ordena ascendente por stock", () => {
    const products: Product[] = [
      { ...productFixture, id: "p_1", stock: 10 },
      { ...productFixture, id: "p_2", stock: 0 },
      { ...productFixture, id: "p_3", stock: 3 },
      { ...productFixture, id: "p_4", stock: 2 },
    ];
    const result = computeLowStock(products, 3);
    expect(result.map((p) => p.id)).toEqual(["p_2", "p_4", "p_3"]);
  });
});
