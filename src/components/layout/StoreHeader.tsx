import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useCart } from "../../hooks/useCart";
import { useTheme } from "../../hooks/useTheme";
import { useProducts } from "../../hooks/useProducts";

// Bug real: el carrito vive en localStorage bajo una sola clave global, sin
// distinguir de quién es -- si el usuario A agrega productos, cierra sesión,
// y el usuario B entra en el mismo navegador (o nadie inicia sesión), B veía
// el carrito de A. Se limpia acá, en el único punto donde ocurre un logout
// real (ver Grupo 2, "se mantienen favs/carrito de otro usuario al cerrar
// sesión") -- los favoritos no tienen este problema porque viven en
// Firestore, se refetchean por uid, y solo se ven detrás de RequireAuth.

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
//
// z-20 en el header (antes z-10, igual que el corazón de FavoriteButton en
// ProductCard): con el mismo z-index, el corazón -- que viene después en
// el DOM -- ganaba el empate y se pintaba encima del header sticky al
// scrollear, en vez de quedar tapado detrás. El header necesita quedar
// por encima de cualquier contenido que pase debajo al hacer scroll.
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

  // categoryId/searchInput/showLanding viven en ProductsContext, arriba de
  // <App/> en main.tsx -- sobreviven la navegación (no son estado local de
  // HomePage). El logo es la única puerta de vuelta al "home completo"
  // (hero/tiles/destacados, ver showLanding): goToLanding() limpia filtro
  // y búsqueda Y prende showLanding -- distinto del pill "Todas" del
  // catálogo, que limpia el filtro pero se queda en el catálogo (ver
  // ProductsContext.tsx). Sin esto, si venías filtrando por una categoría,
  // "volver a home" cambiaba de ruta pero el filtro seguía activo, o si ya
  // estabas en "/" el Link ni navegaba (misma ruta) -- en ambos casos el
  // click en el logo parecía "no llevar a ningún lado". El scroll al top
  // es aparte porque cuando ya se está en "/" el Link no dispara el
  // efecto de ScrollToTop de App.tsx (la ruta no cambia).
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
            // Placeholder neutro mientras Firebase Auth rehidrata la sesión
            // desde IndexedDB (onAuthStateChanged en AuthContext, ~1-2s en
            // un refresh completo): antes esta rama no existía y el header
            // mostraba "Iniciar sesión" un instante aunque hubiera sesión
            // activa, porque solo miraba truthy/falsy de "user" -- nunca el
            // status "loading" que AuthState ya distingue. Tamaño similar a
            // los botones reales para no saltar el layout cuando resuelve.
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
            // Violeta (#7c3aed), no magenta: en todo el resto del sitio el
            // violeta es "acción principal" (Confirmar pedido, Agregar al
            // carrito, Ingresar, Crear producto) y el magenta es "acento"
            // (precio, badge). El CTA más visible para un visitante sin
            // sesión no debería romper esa convención justo en el punto de
            // conversión más importante del header.
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
