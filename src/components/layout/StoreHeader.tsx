import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useCart } from "../../hooks/useCart";
import { useTheme } from "../../hooks/useTheme";

// Header de marca para las páginas del cliente (por ahora HomePage; se va
// sumando al resto). Antes cada página armaba su propia navegación suelta
// -- HomePage en particular tenía 3 items (sesión, carrito, pedidos) como
// hijos directos de un flex justify-between sin wrap controlado, lo que en
// mobile angosto los apretaba/cortaba. Acá el grupo de la derecha
// (carrito/pedidos/sesión) vive junto en un solo flex con flex-wrap, así
// que en pantallas chicas baja de línea como grupo en vez de romperse
// pieza por pieza.
//
// Colores como valores arbitrarios (bg-[#...]) en vez de bg-brand-600: el
// @theme custom de index.css no se está procesando en este setup (ver
// nota ahí), así que los tokens con nombre no generaban CSS real. Por el
// mismo motivo el toggle de tema no usa el dark: variant de Tailwind (que
// en v4 requiere @custom-variant en CSS, otra directiva custom -- mismo
// riesgo que @theme) sino un booleano de useTheme() que elige entre dos
// sets de clases arbitrarias ya confirmadas funcionando.
export function StoreHeader() {
  const { user, signOut } = useAuth();
  const { items } = useCart();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  const cartCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <header
      className={`border-b sticky top-0 z-10 ${
        isDark
          ? "bg-[#161320] border-[#2e2a45]"
          : "bg-white border-[#ede9fe]"
      }`}
    >
      <div className="max-w-5xl mx-auto p-4 flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/"
          className={`font-['Fredoka'] text-2xl font-semibold ${
            isDark ? "text-[#a78bfa]" : "text-[#6d28d9]"
          }`}
        >
          Geekeame
        </Link>

        <div className="flex flex-wrap items-center gap-2 text-sm">
          <button
            onClick={toggleTheme}
            aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
            title={isDark ? "Modo claro" : "Modo oscuro"}
            className={`rounded-full border w-8 h-8 flex items-center justify-center transition-colors ${
              isDark
                ? "border-[#3f3a5c] text-[#c4b5fd] hover:bg-[#211d34]"
                : "border-[#ddd6fe] hover:bg-[#f5f3ff]"
            }`}
          >
            {isDark ? "☀️" : "🌙"}
          </button>

          <Link
            to="/cart"
            aria-label={`Carrito${cartCount > 0 ? ` con ${cartCount} producto${cartCount === 1 ? "" : "s"}` : ""}`}
            className={`relative rounded-full pl-3 pr-3.5 py-1.5 flex items-center gap-1.5 font-medium transition-all hover:scale-105 active:scale-95 ${
              isDark
                ? "bg-[#2e2a45] text-[#f5f3ff] hover:bg-[#3f3a5c]"
                : "bg-[#f5f3ff] text-[#6d28d9] hover:bg-[#ede9fe]"
            }`}
          >
            <span className="text-base" aria-hidden="true">
              🛒
            </span>
            <span className="hidden sm:inline">Carrito</span>
            {cartCount > 0 && (
              <span
                key={cartCount}
                aria-hidden="true"
                className="cart-badge-bump absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-[#db2777] text-white text-[10px] font-bold px-1"
              >
                {cartCount}
              </span>
            )}
          </Link>

          {user && (
            <Link
              to="/orders"
              className={`rounded-full border px-3 py-1 transition-colors ${
                isDark
                  ? "border-[#3f3a5c] text-[#c4b5fd] hover:bg-[#211d34]"
                  : "border-[#ddd6fe] hover:bg-[#f5f3ff]"
              }`}
            >
              Mis pedidos
            </Link>
          )}

          {user?.role === "admin" && (
            <Link
              to="/admin"
              className="rounded-full px-3 py-1 font-medium bg-[#7c3aed] text-white hover:bg-[#6d28d9] transition-colors"
            >
              Panel admin
            </Link>
          )}

          {user ? (
            <div className="flex items-center gap-2">
              <span
                className={`hidden sm:inline ${
                  isDark ? "text-[#9ca3af]" : "text-gray-500"
                }`}
              >
                {user.email}
              </span>
              <button
                onClick={() => signOut()}
                className={`rounded-full border px-3 py-1 transition-colors ${
                  isDark
                    ? "border-[#3f3a5c] text-[#c4b5fd] hover:bg-[#211d34]"
                    : "border-gray-200 hover:bg-gray-50"
                }`}
              >
                Salir
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="rounded-full bg-[#db2777] px-4 py-1.5 font-medium text-white hover:bg-[#be185d] transition-colors"
            >
              Iniciar sesión
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
