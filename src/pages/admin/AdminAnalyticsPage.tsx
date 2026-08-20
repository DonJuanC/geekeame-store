import { useCallback, useEffect, useState } from "react";
import { useTheme } from "../../hooks/useTheme";
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
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [status, setStatus] = useState<Status>("loading");

  const fetchData = useCallback(() => {
    return Promise.all([listAllOrders(), listAllProductsForAdmin()])
      .then(([ordersResult, productsResult]) => {
        setOrders(ordersResult);
        setProducts(productsResult);
        setStatus("idle");
      })
      .catch((err) => {
        console.error(err);
        setStatus("error");
      });
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function handleRetry() {
    setStatus("loading");
    fetchData();
  }

  if (status === "loading")
    return <LoadingState label="Cargando métricas..." dark={isDark} />;
  if (status === "error")
    return (
      <ErrorState
        message="No pudimos cargar las métricas."
        onRetry={handleRetry}
        dark={isDark}
      />
    );

  const revenue = computeRevenueSummary(orders);
  const byStatus = computeOrdersByStatus(orders);
  const topProducts = computeTopProducts(orders);
  const dailySales = computeDailySales(orders);
  const lowStock = computeLowStock(products);

  const cardClass = `rounded-xl border p-4 ${isDark ? "bg-[#1c1a29] border-[#2e2a45]" : "border-[#ede9fe]"}`;
  const mutedText = isDark ? "text-[#9ca3af]" : "text-gray-500";
  const borderColor = isDark ? "border-[#2e2a45]" : "border-[#ede9fe]";
  const pillClass = `rounded-full border px-3 py-1 ${isDark ? "border-[#3f3a5c]" : "border-[#ddd6fe]"}`;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-bold">Analytics</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className={cardClass}>
          <p className={`text-xs ${mutedText}`}>Ingresos totales</p>
          <p className="text-2xl font-bold">{money(revenue.totalRevenue)}</p>
        </div>
        <div className={cardClass}>
          <p className={`text-xs ${mutedText}`}>Pedidos completados</p>
          <p className="text-2xl font-bold">{revenue.completedCount}</p>
        </div>
        <div className={cardClass}>
          <p className={`text-xs ${mutedText}`}>Ticket promedio</p>
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
              <span key={key} className={pillClass}>
                {ORDER_STATUS_LABELS[key]}: <strong>{byStatus[key]}</strong>
              </span>
            ),
          )}
        </div>
      </section>

      <section>
        <h2 className="font-bold mb-2">Ventas de los últimos 7 días</h2>
        <div className={`overflow-x-auto rounded-xl border ${borderColor}`}>
          <table className="w-full text-sm text-left border-collapse">
            <thead className={isDark ? "bg-[#1c1a29]" : "bg-gray-50"}>
              <tr>
                <th className={`p-2 text-xs uppercase ${mutedText}`}>Día</th>
                <th className={`p-2 text-xs uppercase ${mutedText}`}>Pedidos</th>
                <th className={`p-2 text-xs uppercase ${mutedText}`}>Ingresos</th>
              </tr>
            </thead>
            <tbody>
              {dailySales.map((d) => (
                <tr key={d.date} className={`border-t ${borderColor}`}>
                  <td className="p-2">{d.date}</td>
                  <td className="p-2">{d.orders}</td>
                  <td className="p-2">{money(d.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="font-bold mb-2">Productos más vendidos</h2>
        {topProducts.length === 0 ? (
          <p className={`text-sm ${mutedText}`}>
            Todavía no hay pedidos completados para calcular esto.
          </p>
        ) : (
          <div className={`overflow-x-auto rounded-xl border ${borderColor}`}>
            <table className="w-full text-sm text-left border-collapse">
              <thead className={isDark ? "bg-[#1c1a29]" : "bg-gray-50"}>
                <tr>
                  <th className={`p-2 text-xs uppercase ${mutedText}`}>Producto</th>
                  <th className={`p-2 text-xs uppercase ${mutedText}`}>Unidades vendidas</th>
                  <th className={`p-2 text-xs uppercase ${mutedText}`}>Ingresos</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((p) => (
                  <tr key={p.productId} className={`border-t ${borderColor}`}>
                    <td className="p-2">{p.name}</td>
                    <td className="p-2">{p.quantity}</td>
                    <td className="p-2">{money(p.revenue)}</td>
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
          <p className={`text-sm ${mutedText}`}>Ningún producto está bajo de stock.</p>
        ) : (
          <ul className="flex flex-col gap-1 text-sm">
            {lowStock.map((p) => (
              <li key={p.id} className={`${pillClass} flex justify-between`}>
                <span>{p.name}</span>
                <span className={p.stock === 0 ? (isDark ? "text-[#f87171] font-bold" : "text-red-600 font-bold") : ""}>
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
