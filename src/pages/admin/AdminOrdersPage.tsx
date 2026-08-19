import { useCallback, useEffect, useState } from "react";
import { useTheme } from "../../hooks/useTheme";
import {
  listAllOrders,
  updateOrderStatus,
} from "../../services/ordersService";
import type { Order, OrderStatus } from "../../types/order";
import { OrdersTable, OrdersTableSkeleton } from "../../components/admin/OrdersTable";
import { ORDER_STATUS_LABELS } from "../../constants/orderStatus";
import { EmptyState } from "../../components/states/EmptyState";
import { ErrorState } from "../../components/states/ErrorState";

type Status = "loading" | "idle" | "error";

const STATUS_FILTERS: Array<{ value: OrderStatus | "all"; label: string }> = [
  { value: "all", label: "Todos" },
  { value: "pending", label: ORDER_STATUS_LABELS.pending },
  { value: "processing", label: ORDER_STATUS_LABELS.processing },
  { value: "completed", label: ORDER_STATUS_LABELS.completed },
  { value: "cancelled", label: ORDER_STATUS_LABELS.cancelled },
];

export function AdminOrdersPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [orders, setOrders] = useState<Order[]>([]);
  const [status, setStatus] = useState<Status>("loading");
  const [filter, setFilter] = useState<OrderStatus | "all">("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Mismo patrón que AdminProductsPage: nada de setState síncrono al
  // arrancar el efecto (react-hooks/set-state-in-effect). El reintento
  // manual sí resetea "loading"/actionError, porque corre desde un click.
  const fetchOrders = useCallback(() => {
    return listAllOrders()
      .then((result) => {
        setOrders(result);
        setStatus("idle");
      })
      .catch(() => setStatus("error"));
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  function handleRetry() {
    setStatus("loading");
    setActionError(null);
    fetchOrders();
  }

  async function handleStatusChange(order: Order, newStatus: OrderStatus) {
    if (newStatus === order.status) return;

    setUpdatingId(order.id);
    setActionError(null);
    try {
      await updateOrderStatus(order.id, newStatus);
      // Actualiza en memoria en vez de recargar todo: evita un fetch
      // completo por cada cambio de estado y mantiene el filtro actual.
      setOrders((current) =>
        current.map((o) =>
          o.id === order.id ? { ...o, status: newStatus } : o,
        ),
      );
    } catch (err) {
      setActionError(
        err instanceof Error
          ? err.message
          : "No pudimos actualizar el estado del pedido. Intenta de nuevo.",
      );
    } finally {
      setUpdatingId(null);
    }
  }

  const visibleOrders =
    filter === "all" ? orders : orders.filter((o) => o.status === filter);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold">Pedidos</h1>

      <div className="flex gap-2 text-sm flex-wrap">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`rounded-full border px-3 py-1 transition-colors ${
              filter === f.value
                ? "bg-[#7c3aed] border-[#7c3aed] text-white"
                : isDark
                  ? "border-[#3f3a5c] text-[#c4b5fd] hover:bg-[#211d34]"
                  : "border-[#ddd6fe] hover:bg-[#f5f3ff]"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {actionError && (
        <p
          role="alert"
          className={isDark ? "text-[#f87171] text-sm" : "text-red-600 text-sm"}
        >
          {actionError}
        </p>
      )}

      {status === "loading" && <OrdersTableSkeleton dark={isDark} />}
      {status === "error" && (
        <ErrorState
          message="No pudimos cargar los pedidos."
          onRetry={handleRetry}
          dark={isDark}
        />
      )}
      {status === "idle" && visibleOrders.length === 0 && (
        <EmptyState message="No hay pedidos con este filtro." dark={isDark} />
      )}
      {status === "idle" && visibleOrders.length > 0 && (
        <OrdersTable
          orders={visibleOrders}
          updatingId={updatingId}
          onStatusChange={handleStatusChange}
          dark={isDark}
        />
      )}
    </div>
  );
}
