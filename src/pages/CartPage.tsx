import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../hooks/useCart";
import { useTheme } from "../hooks/useTheme";
import { StoreHeader } from "../components/layout/StoreHeader";
import { EmptyState } from "../components/states/EmptyState";
import { ProductImage } from "../components/product/ProductImage";

export function CartPage() {
  const { items, total, updateQuantity, removeItem, clearCart } = useCart();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const navigate = useNavigate();

  function handleClearCart() {
    // A diferencia de "Eliminar producto" en el admin, esto corría en un
    // solo click sin confirmación -- un click accidental vaciaba el
    // carrito completo sin poder deshacer.
    const confirmed = window.confirm(
      "¿Vaciar el carrito? Se eliminarán todos los productos.",
    );
    if (confirmed) clearCart();
  }

  const backLink = (
    <Link
      to="/"
      className={`text-sm font-medium ${
        isDark ? "text-[#c4b5fd] hover:text-[#a78bfa]" : "text-[#6d28d9] hover:text-[#4c1d95]"
      }`}
    >
      ← Volver al catálogo
    </Link>
  );

  if (items.length === 0) {
    return (
      <div className={`min-h-screen ${isDark ? "bg-[#0f0e17] text-[#f5f3ff]" : "bg-white"}`}>
        <StoreHeader />
        <main className="p-4 max-w-2xl mx-auto">
          {backLink}
          <div className="mt-6">
            <EmptyState
              message="Tu carrito está vacío. Agrega productos desde el catálogo para verlos aquí."
              actionLabel="Ir al catálogo"
              onAction={() => navigate("/")}
              dark={isDark}
            />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? "bg-[#0f0e17] text-[#f5f3ff]" : "bg-white"}`}>
      <StoreHeader />
      <main className="p-4 max-w-2xl mx-auto">
        {backLink}
        <h1 className="text-xl font-bold my-4">Tu carrito</h1>

        <div className="flex flex-col gap-3">
          {items.map((item) => (
            <div
              key={item.productId}
              className={`flex flex-wrap items-center gap-3 rounded-xl border p-3 ${
                isDark ? "bg-[#1c1a29] border-[#2e2a45]" : "border-[#ede9fe]"
              }`}
            >
              <ProductImage
                product={item}
                className="w-16 h-16 object-cover rounded-lg shrink-0"
                dark={isDark}
              />
              <div className="flex-1 min-w-[140px]">
                <p className="font-medium text-sm">{item.name}</p>
                <p className={isDark ? "text-[#9ca3af] text-sm" : "text-gray-600 text-sm"}>
                  ${item.price.toLocaleString("es-CO")} c/u
                </p>
                {/* Subtotal de la línea (precio x cantidad) -- antes solo se
                    mostraba el precio unitario acá; el total combinado recién
                    aparecía al final del carrito, sin desglose por producto. */}
                <p className="text-sm font-medium mt-0.5">
                  = ${(item.price * item.quantity).toLocaleString("es-CO")}
                </p>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                    aria-label="Restar uno"
                    className={`rounded-full border w-9 h-9 flex items-center justify-center transition-colors ${
                      isDark
                        ? "border-[#3f3a5c] hover:bg-[#211d34]"
                        : "border-[#ddd6fe] hover:bg-[#f5f3ff]"
                    }`}
                  >
                    -
                  </button>
                  <span className="w-4 text-center text-sm" aria-label={`Cantidad: ${item.quantity}`}>
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                    disabled={item.stock !== undefined && item.quantity >= item.stock}
                    aria-label="Sumar uno"
                    title={
                      item.stock !== undefined && item.quantity >= item.stock
                        ? "Alcanzaste el stock disponible"
                        : undefined
                    }
                    className={`rounded-full border w-9 h-9 flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                      isDark
                        ? "border-[#3f3a5c] hover:bg-[#211d34]"
                        : "border-[#ddd6fe] hover:bg-[#f5f3ff]"
                    }`}
                  >
                    +
                  </button>
                </div>
                <button
                  onClick={() => removeItem(item.productId)}
                  className={`text-sm font-medium ${
                    isDark ? "text-[#f87171] hover:text-[#fca5a5]" : "text-red-600 hover:text-red-700"
                  }`}
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>

        <div
          className={`flex items-center justify-between mt-6 border-t pt-4 ${
            isDark ? "border-[#2e2a45]" : "border-[#ede9fe]"
          }`}
        >
          <p className="text-lg font-medium">
            Total: ${total.toLocaleString("es-CO")}
          </p>
          <button
            onClick={handleClearCart}
            className={`text-sm underline ${isDark ? "text-[#9ca3af]" : "text-gray-600"}`}
          >
            Vaciar carrito
          </button>
        </div>
        <Link
          to="/checkout"
          className="block text-center rounded-full px-4 py-2.5 mt-4 font-medium bg-[#7c3aed] text-white hover:bg-[#6d28d9] transition-colors"
        >
          Proceder al pago
        </Link>
      </main>
    </div>
  );
}
