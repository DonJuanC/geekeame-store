import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useCart } from "../hooks/useCart";
import { useAuth } from "../hooks/useAuth";
import { createOrder } from "../services/ordersService";
import type { OrderItemSnapshot } from "../types/order";

export function CheckoutPage() {
  const { items, total, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    if (!user || status === "submitting") return;

    setStatus("submitting");
    setError(null);

    const orderItems: OrderItemSnapshot[] = items.map((item) => ({
      productId: item.productId,
      name: item.name,
      priceAtPurchase: item.price,
      quantity: item.quantity,
    }));

    try {
      const orderId = await createOrder(user.uid, orderItems, total);
      clearCart();
      navigate(`/orders?confirmed=${orderId}`);
    } catch (err) {
      setStatus("error");
      setError(
        err instanceof Error ? err.message : "No pudimos procesar tu pedido.",
      );
    }
  }

  if (items.length === 0) {
    return (
      <div className="p-4 max-w-2xl mx-auto">
        <Link to="/" className="text-sm underline">
          ← Volver al catálogo
        </Link>
        <p className="mt-6 text-center text-gray-500">
          Tu carrito está vacío, no hay nada que pagar.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <Link to="/cart" className="text-sm underline">
        ← Volver al carrito
      </Link>
      <h1 className="text-xl font-bold my-4">Confirmar pedido</h1>

      <div className="flex flex-col gap-3">
        {items.map((item) => (
          <div key={item.productId} className="flex justify-between text-sm border-b pb-2">
            <span>{item.name} x{item.quantity}</span>
            <span>${(item.price * item.quantity).toLocaleString("es-CO")}</span>
          </div>
        ))}
      </div>

      <p className="text-lg font-medium mt-4">
        Total: ${total.toLocaleString("es-CO")}
      </p>

      {status === "error" && (
        <p className="text-red-600 text-sm mt-3">{error}</p>
      )}

      <button
        onClick={handleConfirm}
        disabled={status === "submitting"}
        className="border rounded px-4 py-2 mt-4 w-full disabled:opacity-50"
      >
        {status === "submitting" ? "Procesando..." : "Confirmar pedido"}
      </button>
    </div>
  );
}
