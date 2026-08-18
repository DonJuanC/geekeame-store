import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getOrderById } from "../services/ordersService";
import { LoadingState } from "../components/states/LoadingState";
import { ErrorState } from "../components/states/ErrorState";
import type { Order } from "../types/order";
import { ORDER_STATUS_LABELS } from "../constants/orderStatus";

// permission-denied es el caso real acá: firestore.rules solo deja leer una
// orden a su dueño o a un admin, así que un customer que edite la URL para
// mirar la orden de otro recibe ese código en vez de "not-found".
function friendlyError(err: unknown): string {
  const code = (err as { code?: string })?.code;
  if (code === "permission-denied") {
    return "No tienes permiso para ver esta orden.";
  }
  return "No pudimos cargar el detalle de la orden.";
}

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [status, setStatus] = useState<"idle" | "error" | "not-found">(
    "idle",
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // Mismo patrón que ProductDetailPage/AdminProductFormPage: "loadedId"
  // marca para qué id ya son válidos order/status, en vez de resetear con
  // un setStatus("loading") síncrono al arrancar el efecto.
  const [loadedId, setLoadedId] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    getOrderById(id)
      .then((result) => {
        if (cancelled) return;
        setLoadedId(id);
        if (!result) {
          setStatus("not-found");
          return;
        }
        setOrder(result);
        setStatus("idle");
      })
      .catch((err) => {
        if (cancelled) return;
        setLoadedId(id);
        setStatus("error");
        setErrorMessage(friendlyError(err));
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const isLoading = Boolean(id) && loadedId !== id;

  if (isLoading) return <LoadingState label="Cargando orden..." />;

  if (status === "error") {
    return (
      <div className="p-4 max-w-2xl mx-auto">
        <Link to="/orders" className="text-sm underline">
          ← Volver a mis pedidos
        </Link>
        <ErrorState message={errorMessage ?? "No pudimos cargar la orden."} />
      </div>
    );
  }

  if (status === "not-found" || !order) {
    return (
      <div className="p-4 max-w-2xl mx-auto">
        <Link to="/orders" className="text-sm underline">
          ← Volver a mis pedidos
        </Link>
        <ErrorState message="Esta orden no existe." />
      </div>
    );
  }

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <Link to="/orders" className="text-sm underline">
        ← Volver a mis pedidos
      </Link>

      <div className="flex items-center justify-between my-4">
        <h1 className="text-xl font-bold">Orden {order.id.slice(0, 8)}</h1>
        <span className="border rounded px-3 py-1 text-sm">
          {ORDER_STATUS_LABELS[order.status]}
        </span>
      </div>

      <p className="text-gray-600 text-sm">
        {new Date(order.createdAt).toLocaleDateString("es-CO", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </p>

      <div className="flex flex-col gap-3 mt-4">
        {order.items.map((item) => (
          <div
            key={item.productId}
            className="flex justify-between text-sm border-b pb-2"
          >
            <span>
              {item.name} x{item.quantity}
            </span>
            <span>
              ${(item.priceAtPurchase * item.quantity).toLocaleString(
                "es-CO",
              )}
            </span>
          </div>
        ))}
      </div>

      <p className="text-lg font-medium mt-4">
        Total: ${order.total.toLocaleString("es-CO")}
      </p>
    </div>
  );
}
