import { useEffect, useState } from "react";
import { useTheme } from "../../hooks/useTheme";
import {
  subscribeToAllOrders,
  updateOrderStatus,
} from "../../services/ordersService";
import type { Order, OrderStatus } from "../../types/order";
import { OrdersTable, OrdersTableSkeleton } from "../../components/admin/OrdersTable";
import { ORDER_STATUS_LABELS } from "../../constants/orderStatus";
import { EmptyState } from "../../components/states/EmptyState";
import { ErrorState } from "../../components/states/ErrorState";
import { AdminPageTitle } from "../../components/admin/AdminPageTitle";

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
  // Solo para forzar una nueva suscripción desde "Reintentar" -- onSnapshot
  // ya reconecta solo ante caídas de red transitorias; esto es para el caso
  // de un error no recuperable (ej. permission-denied) donde el listener
  // quedó desconectado y hay que volver a suscribirse desde cero.
  const [retryKey, setRetryKey] = useState(0);

  // Tiempo real: un admin que deja esta pestaña abierta ve pedidos nuevos
  // de cualquier cliente sin refrescar -- antes era un fetch de una sola
  // vez (listAllOrders) que solo se actualizaba con un reintento manual o
  // un recargo de página. setOrders/setStatus acá corren dentro del
  // callback de onSnapshot, no en el cuerpo síncrono del efecto (que solo
  // llama a subscribeToAllOrders y devuelve el unsubscribe) -- no dispara
  // react-hooks/set-state-in-effect.
  useEffect(() => {
    const unsubscribe = subscribeToAllOrders(
      (result) => {
        setOrders(result);
        setStatus("idle");
      },
      (err) => {
        console.error(err);
        setStatus("error");
      },
    );
    return unsubscribe;
  }, [retryKey]);

  function handleRetry() {
    setStatus("loading");
    setActionError(null);
    setRetryKey((k) => k + 1);
  }

  async function handleStatusChange(order: Order, newStatus: OrderStatus) {
    if (newStatus === order.status) return;

    setUpdatingId(order.id);
    setActionError(null);
    try {
      // Sin actualización optimista en memoria: la suscripción de arriba
      // ya refleja el cambio apenas Firestore lo confirma (el propio SDK
      // hace un eco casi instantáneo desde cache local), así que mantener
      // un setOrders manual acá sería estado duplicado sin necesidad.
      await updateOrderStatus(order.id, newStatus);
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
      <AdminPageTitle title="Pedidos" />

      <div className="flex gap-2 text-sm flex-wrap">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            aria-pressed={filter === f.value}
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
