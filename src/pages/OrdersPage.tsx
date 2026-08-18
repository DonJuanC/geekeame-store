import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useTheme } from "../hooks/useTheme";
import { StoreHeader } from "../components/layout/StoreHeader";
import { listOrdersForUser } from "../services/ordersService";
import { LoadingState } from "../components/states/LoadingState";
import { ErrorState } from "../components/states/ErrorState";
import type { Order } from "../types/order";
import { EmptyState } from "../components/states/EmptyState";

const STATUS_LABELS: Record<Order["status"], string> = {
  pending: "Pendiente",
  processing: "En proceso",
  completed: "Completado",
  cancelled: "Cancelado",
};

export function OrdersPage() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [searchParams] = useSearchParams();
  const confirmedId = searchParams.get("confirmed");
  const [orders, setOrders] = useState<Order[]>([]);
  const [status, setStatus] = useState<"idle" | "error">("idle");
  // Uid para el que "orders"/"status" ya son válidos. Mismo patrón que
  // ProductDetailPage/AdminProductFormPage para no resetear "loading" de
  // forma síncrona al arrancar el efecto (react-hooks/set-state-in-effect).
  const [loadedUid, setLoadedUid] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    listOrdersForUser(user.uid)
      .then((result) => {
        if (cancelled) return;
        setOrders(result);
        setStatus("idle");
        setLoadedUid(user.uid);
      })
      .catch(() => {
        if (cancelled) return;
        setStatus("error");
        setLoadedUid(user.uid);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const isLoading = Boolean(user) && loadedUid !== user?.uid;

  return (
    <div className={`min-h-screen ${isDark ? "bg-[#0f0e17] text-[#f5f3ff]" : "bg-white"}`}>
      <StoreHeader />
      <div className="p-4 max-w-2xl mx-auto">
        <Link
          to="/"
          className={`text-sm font-medium ${
            isDark ? "text-[#c4b5fd] hover:text-[#a78bfa]" : "text-[#6d28d9] hover:text-[#4c1d95]"
          }`}
        >
          ← Volver al catálogo
        </Link>
        <h1 className="text-xl font-bold my-4">Mis pedidos</h1>

        {confirmedId && (
          <p
            className={`text-sm p-3 rounded-lg mb-4 ${
              isDark ? "bg-[#14291d] text-[#86efac]" : "bg-green-50 text-green-700"
            }`}
          >
            ¡Pedido confirmado! Número de orden: {confirmedId}
          </p>
        )}

        {isLoading && <LoadingState label="Cargando pedidos..." dark={isDark} />}
        {!isLoading && status === "error" && (
          <ErrorState message="No pudimos cargar tus pedidos." dark={isDark} />
        )}
        {!isLoading && status === "idle" && orders.length === 0 && (
          <EmptyState message="Todavía no tienes pedidos." dark={isDark} />
        )}
        {!isLoading && status === "idle" && orders.length > 0 && (
          <div className="flex flex-col gap-3">
            {orders.map((order) => (
              <Link
                key={order.id}
                to={`/orders/${order.id}`}
                className={`rounded-xl border p-3 transition-colors ${
                  isDark
                    ? "bg-[#1c1a29] border-[#2e2a45] hover:border-[#7c3aed]"
                    : "border-[#ede9fe] hover:bg-[#f5f3ff]"
                }`}
              >
                <div className="flex justify-between text-sm">
                  <span className="font-medium">
                    Orden {order.id.slice(0, 8)}
                  </span>
                  <span>{STATUS_LABELS[order.status]}</span>
                </div>
                <p className={isDark ? "text-[#9ca3af] text-sm" : "text-gray-600 text-sm"}>
                  {new Date(order.createdAt).toLocaleDateString("es-CO")}
                </p>
                <p className="text-sm mt-1">
                  {order.items.length} producto(s) - $
                  {order.total.toLocaleString("es-CO")}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
