import { useEffect, useState, type ReactNode } from "react";
import { useParams, Link } from "react-router-dom";
import { useTheme } from "../hooks/useTheme";
import { StoreHeader } from "../components/layout/StoreHeader";
import { getOrderById } from "../services/ordersService";
import { LoadingState } from "../components/states/LoadingState";
import { ErrorState } from "../components/states/ErrorState";
import type { Order } from "../types/order";
import { ORDER_STATUS_LABELS } from "../constants/orderStatus";

function friendlyError(err: unknown): string {
  const code = (err as { code?: string })?.code;
  if (code === "permission-denied") {
    return "No tienes permiso para ver esta orden.";
  }
  return "No pudimos cargar el detalle de la orden.";
}

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [order, setOrder] = useState<Order | null>(null);
  const [status, setStatus] = useState<"idle" | "error" | "not-found">(
    "idle",
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
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

  const shell = (children: ReactNode) => (
    <div className={`min-h-screen ${isDark ? "bg-[#0f0e17] text-[#f5f3ff]" : "bg-white"}`}>
      <StoreHeader />
      <main className="p-4 max-w-2xl mx-auto">{children}</main>
    </div>
  );

  const backLink = (
    <Link
      to="/orders"
      className={`text-sm font-medium ${
        isDark ? "text-[#c4b5fd] hover:text-[#a78bfa]" : "text-[#6d28d9] hover:text-[#4c1d95]"
      }`}
    >
      ← Volver a mis pedidos
    </Link>
  );

  if (isLoading) return shell(<LoadingState label="Cargando orden..." dark={isDark} />);

  if (status === "error") {
    return shell(
      <>
        {backLink}
        <ErrorState message={errorMessage ?? "No pudimos cargar la orden."} dark={isDark} />
      </>,
    );
  }

  if (status === "not-found" || !order) {
    return shell(
      <>
        {backLink}
        <ErrorState message="Esta orden no existe." dark={isDark} />
      </>,
    );
  }

  return shell(
    <>
      {backLink}

      <div className="flex items-center justify-between my-4">
        <h1 className="text-xl font-bold">Orden {order.id.slice(0, 8)}</h1>
        <span
          className={`rounded-full border px-3 py-1 text-sm ${
            isDark ? "border-[#3f3a5c] text-[#c4b5fd]" : "border-[#ddd6fe] text-[#6d28d9]"
          }`}
        >
          {ORDER_STATUS_LABELS[order.status]}
        </span>
      </div>

      <p className={isDark ? "text-[#9ca3af] text-sm" : "text-gray-600 text-sm"}>
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
            className={`flex justify-between text-sm border-b pb-2 ${
              isDark ? "border-[#2e2a45]" : "border-[#ede9fe]"
            }`}
          >
            <span>
              {item.name} x{item.quantity}
            </span>
            <span>
              ${(item.priceAtPurchase * item.quantity).toLocaleString("es-CO")}
            </span>
          </div>
        ))}
      </div>

      <p className="text-lg font-medium mt-4">
        Total: ${order.total.toLocaleString("es-CO")}
      </p>
    </>,
  );
}
