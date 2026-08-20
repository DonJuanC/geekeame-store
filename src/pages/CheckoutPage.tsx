import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useCart } from "../hooks/useCart";
import { useAuth } from "../hooks/useAuth";
import { useTheme } from "../hooks/useTheme";
import { StoreHeader } from "../components/layout/StoreHeader";
import { createOrder, OrderTimeoutError } from "../services/ordersService";
import type { OrderItemSnapshot } from "../types/order";

export function CheckoutPage() {
  const { items, total, clearCart } = useCart();
  const { user } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const navigate = useNavigate();
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  // "Ya no hay stock suficiente..." (ver ordersService.createOrder) explica
  // qué pasó pero no daba un camino directo de vuelta al carrito -- el
  // usuario tenía que adivinar que hay que ir a ajustar cantidades.
  const [isStockError, setIsStockError] = useState(false);

  async function handleConfirm() {
    if (!user || status === "submitting") return;

    // Chequeo temprano: si el navegador ya sabe que no hay red, ni vale la
    // pena esperar los 20s del timeout de createOrder -- avisamos de una vez.
    if (!navigator.onLine) {
      setStatus("error");
      setError("Estás sin conexión. Conéctate a internet e intenta de nuevo.");
      setIsStockError(false);
      return;
    }

    setStatus("submitting");
    setError(null);
    setIsStockError(false);

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
      if (err instanceof OrderTimeoutError) {
        // No sabemos si la transacción de Firestore terminó de todos modos
        // (no hay forma de cancelarla desde el cliente) -- por eso el
        // mensaje manda a revisar "Mis pedidos" en vez de solo "reintenta",
        // para no arriesgar un pedido duplicado si sí se creó.
        setError(
          "Esto está tardando más de lo normal. Revisa tu conexión: si el pedido no aparece en \"Mis pedidos\" en un momento, puedes intentar de nuevo.",
        );
      } else {
        const message =
          err instanceof Error ? err.message : "No pudimos procesar tu pedido.";
        setError(message);
        setIsStockError(message.toLowerCase().includes("stock"));
      }
    }
  }

  const shellClass = `min-h-screen ${isDark ? "bg-[#0f0e17] text-[#f5f3ff]" : "bg-white"}`;
  const backLinkClass = `text-sm font-medium ${
    isDark ? "text-[#c4b5fd] hover:text-[#a78bfa]" : "text-[#6d28d9] hover:text-[#4c1d95]"
  }`;

  if (items.length === 0) {
    return (
      <div className={shellClass}>
        <StoreHeader />
        <main className="p-4 max-w-2xl mx-auto">
          <Link to="/" className={backLinkClass}>
            ← Volver al catálogo
          </Link>
          <p className={`mt-6 text-center ${isDark ? "text-[#9ca3af]" : "text-gray-500"}`}>
            Tu carrito está vacío, no hay nada que pagar.
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className={shellClass}>
      <StoreHeader />
      <main className="p-4 max-w-2xl mx-auto">
        <Link to="/cart" className={backLinkClass}>
          ← Volver al carrito
        </Link>
        <h1 className="text-xl font-bold my-4">Confirmar pedido</h1>

        <div className="flex flex-col gap-3">
          {items.map((item) => (
            <div
              key={item.productId}
              className={`flex justify-between text-sm border-b pb-2 ${
                isDark ? "border-[#2e2a45]" : "border-[#ede9fe]"
              }`}
            >
              <span>
                {item.name} x{item.quantity}
              </span>
              <span>${(item.price * item.quantity).toLocaleString("es-CO")}</span>
            </div>
          ))}
        </div>

        <p className="text-lg font-medium mt-4">
          Total: ${total.toLocaleString("es-CO")}
        </p>

        {status === "error" && (
          <div className="mt-3">
            <p role="alert" className={isDark ? "text-[#f87171] text-sm" : "text-red-600 text-sm"}>
              {error}
            </p>
            {isStockError && (
              <Link
                to="/cart"
                className={`text-sm underline ${isDark ? "text-[#c4b5fd]" : "text-[#6d28d9]"}`}
              >
                Ajustar cantidades en el carrito
              </Link>
            )}
          </div>
        )}

        <button
          onClick={handleConfirm}
          disabled={status === "submitting"}
          className="w-full rounded-full px-4 py-2.5 mt-4 font-medium bg-[#7c3aed] text-white hover:bg-[#6d28d9] disabled:opacity-50 transition-colors"
        >
          {status === "submitting" ? "Procesando..." : "Confirmar pedido"}
        </button>
      </main>
    </div>
  );
}
