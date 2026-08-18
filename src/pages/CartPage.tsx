import { Link } from "react-router-dom";
import { useCart } from "../hooks/useCart";
import { EmptyState } from "../components/states/EmptyState";

export function CartPage() {
  const { items, total, updateQuantity, removeItem, clearCart } = useCart();

  if (items.length === 0) {
    return (
      <div className="p-4 max-w-2xl mx-auto">
        <Link to="/" className="text-sm underline">
          ← Volver al catálogo
        </Link>
        <div className="mt-6">
          <EmptyState message="Tu carrito está vacío." />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <Link to="/" className="text-sm underline">
        ← Volver al catálogo
      </Link>
      <h1 className="text-xl font-bold my-4">Tu carrito</h1>

      <div className="flex flex-col gap-3">
        {items.map((item) => (
          <div
            key={item.productId}
            className="flex items-center gap-3 border rounded p-3"
          >
            <img
              src={item.imageUrl}
              alt={item.name}
              className="w-16 h-16 object-cover rounded"
            />
            <div className="flex-1">
              <p className="font-medium text-sm">{item.name}</p>
              <p className="text-gray-600 text-sm">
                ${item.price.toLocaleString("es-CO")}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  updateQuantity(item.productId, item.quantity - 1)
                }
                className="border rounded px-2"
              >
                -
              </button>
              <span>{item.quantity}</span>
              <button
                onClick={() =>
                  updateQuantity(item.productId, item.quantity + 1)
                }
                className="border rounded px-2"
              >
                +
              </button>
            </div>
            <button
              onClick={() => removeItem(item.productId)}
              className="text-red-600 text-sm"
            >
              Eliminar
            </button>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mt-6 border-t pt-4">
        <p className="text-lg font-medium">
          Total: ${total.toLocaleString("es-CO")}
        </p>
        <button onClick={clearCart} className="text-sm underline text-gray-600">
          Vaciar carrito
        </button>
      </div>
      <Link
        to="/checkout"
        className="block text-center border rounded px-4 py-2 mt-4 bg-black text-white"
      >
        Proceder al pago
      </Link>
    </div>
  );
}
