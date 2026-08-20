import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useCart } from "../../hooks/useCart";
import { useTheme } from "../../hooks/useTheme";
import { useProducts } from "../../hooks/useProducts";

export function StoreHeader() {
  const { user, status: authStatus, signOut } = useAuth();
  const { items, clearCart } = useCart();
  const { theme, toggleTheme } = useTheme();
  const { goToLanding } = useProducts();
  const location = useLocation();
  const isDark = theme === "dark";
  const cartCount = items.reduce((sum, i) => sum + i.quantity, 0);

  async function handleSignOut() {
    await signOut();
    clearCart();
  }

  function handleLogoClick() {
    goToLanding();
    if (location.pathname === "/") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  return (
    <header
      className={`border-b sticky top-0 z-20 ${
        isDark
          ? "bg-[#161320] border-[#2e2a45]"
          : "bg-white border-[#ede9fe]"
      }`}
    >
      <div className="max-w-5xl mx-auto p-4 flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/"
          onClick={handleLogoClick}
          className={`logo-hover-wiggle inline-block font-['Fredoka'] text-2xl font-semibold ${
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
            className={`rounded-full border w-9 h-9 flex items-center justify-center transition-colors ${
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
              to="/favorites"
              aria-label="Favoritos"
              className={`rounded-full border pl-3 pr-3.5 py-1.5 flex items-center gap-1.5 transition-colors ${
                isDark
                  ? "border-[#3f3a5c] text-[#c4b5fd] hover:bg-[#211d34]"
                  : "border-[#ddd6fe] hover:bg-[#f5f3ff]"
              }`}
            >
              <span className="text-base" aria-hidden="true">
                ❤️
              </span>
              <span className="hidden sm:inline">Favoritos</span>
            </Link>
          )}

          {user && (
            <Link
              to="/orders"
              aria-label="Mis pedidos"
              className={`rounded-full border pl-3 pr-3.5 py-1.5 flex items-center gap-1.5 transition-colors ${
                isDark
                  ? "border-[#3f3a5c] text-[#c4b5fd] hover:bg-[#211d34]"
                  : "border-[#ddd6fe] hover:bg-[#f5f3ff]"
              }`}
            >
              <span className="text-base" aria-hidden="true">
                📦
              </span>
              <span className="hidden sm:inline">Mis pedidos</span>
            </Link>
          )}

          {user?.role === "admin" && (
            <Link
              to="/admin"
              aria-label="Panel admin"
              className="rounded-full pl-3 pr-3.5 py-1.5 flex items-center gap-1.5 font-medium bg-[#7c3aed] text-white hover:bg-[#6d28d9] transition-colors"
            >
              <span className="text-base" aria-hidden="true">
                ⚙️
              </span>
              <span className="hidden sm:inline">Panel admin</span>
            </Link>
          )}

          {authStatus === "loading" ? (
            <div
              aria-hidden="true"
              className={`rounded-full w-28 h-9 animate-pulse ${
                isDark ? "bg-[#2e2a45]" : "bg-[#ede9fe]"
              }`}
            />
          ) : user ? (
            <div className="flex items-center gap-2">
              <span
                className={`hidden sm:inline ${
                  isDark ? "text-[#9ca3af]" : "text-gray-500"
                }`}
              >
                {user.email}
              </span>
              <button
                onClick={() => void handleSignOut()}
                aria-label="Salir"
                className={`rounded-full border pl-3 pr-3.5 py-1.5 flex items-center gap-1.5 transition-colors ${
                  isDark
                    ? "border-[#3f3a5c] text-[#c4b5fd] hover:bg-[#211d34]"
                    : "border-[#ddd6fe] hover:bg-[#f5f3ff]"
                }`}
              >
                <span className="text-base" aria-hidden="true">
                  🚪
                </span>
                <span className="hidden sm:inline">Salir</span>
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              aria-label="Iniciar sesión"
              className="rounded-full pl-3 pr-4 py-1.5 flex items-center gap-1.5 font-medium bg-[#7c3aed] text-white hover:bg-[#6d28d9] transition-colors"
            >
              <span className="text-base" aria-hidden="true">
                👤
              </span>
              Iniciar sesión
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
