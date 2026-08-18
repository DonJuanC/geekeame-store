import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
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
  const [searchParams] = useSearchParams();
  const confirmedId = searchParams.get("confirmed");
  const [orders, setOrders] = useState<Order[]>([]);
  const [status, setStatus] = useState<"loading" | "idle" | "error">("loading");

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setStatus("loading");
    listOrdersForUser(user.uid)
      .then((result) => {
        if (cancelled) return;
        setOrders(result);
        setStatus("idle");
      })
      .catch(() => {
        if (cancelled) return;
        setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <Link to="/" className="text-sm underline">
        ← Volver al catálogo
      </Link>
      <h1 className="text-xl font-bold my-4">Mis pedidos</h1>

      {confirmedId && (
        <p className="bg-green-50 text-green-700 text-sm p-3 rounded mb-4">
          ¡Pedido confirmado! Número de orden: {confirmedId}
        </p>
      )}

      {status === "loading" && <LoadingState label="Cargando pedidos..." />}
      {status === "error" && (
        <ErrorState message="No pudimos cargar tus pedidos." />
      )}
      {status === "idle" && orders.length === 0 && (
        <EmptyState message="Todavía no tienes pedidos." />
      )}
      {status === "idle" && orders.length > 0 && (
        <div className="flex flex-col gap-3">
          {orders.map((order) => (
            <div key={order.id} className="border rounded p-3">
              <div className="flex justify-between text-sm">
                <span className="font-medium">
                  Orden {order.id.slice(0, 8)}
                </span>
                <span>{STATUS_LABELS[order.status]}</span>
              </div>
              <p className="text-gray-600 text-sm">
                {new Date(order.createdAt).toLocaleDateString("es-CO")}
              </p>
              <p className="text-sm mt-1">
                {order.items.length} producto(s) - $
                {order.total.toLocaleString("es-CO")}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
