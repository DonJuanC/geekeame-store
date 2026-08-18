import { useCallback, useEffect, useState } from "react";
import { listAllOrders } from "../../services/ordersService";
import { listAllProductsForAdmin } from "../../services/productsService";
import {
  computeDailySales,
  computeLowStock,
  computeOrdersByStatus,
  computeRevenueSummary,
  computeTopProducts,
} from "../../services/analyticsService";
import type { Order } from "../../types/order";
import type { Product } from "../../types/product";
import { ORDER_STATUS_LABELS } from "../../constants/orderStatus";
import { LoadingState } from "../../components/states/LoadingState";
import { ErrorState } from "../../components/states/ErrorState";

type Status = "loading" | "idle" | "error";

function money(value: number): string {
  return `$${value.toLocaleString("es-CO")}`;
}

export function AdminAnalyticsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [status, setStatus] = useState<Status>("loading");

  // Se traen órdenes y productos juntos: el dashboard combina ambas
  // fuentes (top productos vendidos sale de orders, stock bajo sale de
  // products). Mismo patrón loading/idle/error que el resto del panel
  // admin -- nada de setState síncrono al arrancar el efecto.
  const fetchData = useCallback(() => {
    return Promise.all([listAllOrders(), listAllProductsForAdmin()])
      .then(([ordersResult, productsResult]) => {
        setOrders(ordersResult);
        setProducts(productsResult);
        setStatus("idle");
      })
      .catch(() => setStatus("error"));
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function handleRetry() {
    setStatus("loading");
    fetchData();
  }

  if (status === "loading") return <LoadingState label="Cargando métricas..." />;
  if (status === "error")
    return (
      <ErrorState
        message="No pudimos cargar las métricas."
        onRetry={handleRetry}
      />
    );

  const revenue = computeRevenueSummary(orders);
  const byStatus = computeOrdersByStatus(orders);
  const topProducts = computeTopProducts(orders);
  const dailySales = computeDailySales(orders);
  const lowStock = computeLowStock(products);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-bold">Analytics</h1>

      {/* Ingresos solo cuentan órdenes "completed" -- ver analyticsService. */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="border rounded p-4">
          <p className="text-xs text-gray-500">Ingresos totales</p>
          <p className="text-2xl font-bold">{money(revenue.totalRevenue)}</p>
        </div>
        <div className="border rounded p-4">
          <p className="text-xs text-gray-500">Pedidos completados</p>
          <p className="text-2xl font-bold">{revenue.completedCount}</p>
        </div>
        <div className="border rounded p-4">
          <p className="text-xs text-gray-500">Ticket promedio</p>
          <p className="text-2xl font-bold">
            {money(Math.round(revenue.averageOrderValue))}
          </p>
        </div>
      </div>

      <section>
        <h2 className="font-bold mb-2">Pedidos por estado</h2>
        <div className="flex gap-3 flex-wrap text-sm">
          {(Object.keys(byStatus) as Array<keyof typeof byStatus>).map(
            (key) => (
              <span key={key} className="border rounded px-3 py-1">
                {ORDER_STATUS_LABELS[key]}: <strong>{byStatus[key]}</strong>
              </span>
            ),
          )}
        </div>
      </section>

      <section>
        <h2 className="font-bold mb-2">Ventas de los últimos 7 días</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-left text-gray-500">
                <th className="py-1 pr-4">Día</th>
                <th className="py-1 pr-4">Pedidos</th>
                <th className="py-1">Ingresos</th>
              </tr>
            </thead>
            <tbody>
              {dailySales.map((d) => (
                <tr key={d.date} className="border-t">
                  <td className="py-1 pr-4">{d.date}</td>
                  <td className="py-1 pr-4">{d.orders}</td>
                  <td className="py-1">{money(d.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="font-bold mb-2">Productos más vendidos</h2>
        {topProducts.length === 0 ? (
          <p className="text-sm text-gray-500">
            Todavía no hay pedidos completados para calcular esto.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="text-left text-gray-500">
                  <th className="py-1 pr-4">Producto</th>
                  <th className="py-1 pr-4">Unidades vendidas</th>
                  <th className="py-1">Ingresos</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((p) => (
                  <tr key={p.productId} className="border-t">
                    <td className="py-1 pr-4">{p.name}</td>
                    <td className="py-1 pr-4">{p.quantity}</td>
                    <td className="py-1">{money(p.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="font-bold mb-2">Stock bajo (≤3 unidades)</h2>
        {lowStock.length === 0 ? (
          <p className="text-sm text-gray-500">
            Ningún producto está bajo de stock.
          </p>
        ) : (
          <ul className="flex flex-col gap-1 text-sm">
            {lowStock.map((p) => (
              <li
                key={p.id}
                className="border rounded px-3 py-1 flex justify-between"
              >
                <span>{p.name}</span>
                <span className={p.stock === 0 ? "text-red-600 font-bold" : ""}>
                  {p.stock} unidades
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
