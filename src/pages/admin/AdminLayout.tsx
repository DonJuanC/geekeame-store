import { Link, NavLink, Outlet } from "react-router-dom";
import { useTheme } from "../../hooks/useTheme";

// Layout del panel admin. Antes tenía su propio look fijo (header
// bg-gray-900) "separado por completo de la tienda pública" -- a pedido
// se unificó con la paleta pop geek arcade + el mismo toggle claro/oscuro
// que el resto del sitio, en vez de mantener dos sistemas de diseño
// distintos. Las rutas hijas (listado, alta, edición) se inyectan en
// <Outlet />.
export function AdminLayout() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `rounded-full px-3 py-1 transition-colors ${
      isActive
        ? "bg-[#7c3aed] text-white"
        : isDark
          ? "text-[#c4b5fd] hover:bg-[#211d34]"
          : "text-[#6d28d9] hover:bg-[#f5f3ff]"
    }`;

  return (
    <div className={`min-h-screen flex flex-col ${isDark ? "bg-[#0f0e17] text-[#f5f3ff]" : "bg-white"}`}>
      <header
        className={`border-b sticky top-0 z-10 ${
          isDark ? "bg-[#161320] border-[#2e2a45]" : "bg-white border-[#ede9fe]"
        }`}
      >
        <div className="max-w-5xl mx-auto p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-4">
            <span className={`font-['Fredoka'] text-lg font-semibold ${isDark ? "text-[#a78bfa]" : "text-[#6d28d9]"}`}>
              Geekeame · Admin
            </span>
            <nav className="flex gap-2 text-sm flex-wrap">
              <NavLink to="/admin" end className={navLinkClass}>
                Productos
              </NavLink>
              <NavLink to="/admin/orders" className={navLinkClass}>
                Pedidos
              </NavLink>
              <NavLink to="/admin/analytics" className={navLinkClass}>
                Analytics
              </NavLink>
              <NavLink to="/admin/users" className={navLinkClass}>
                Usuarios
              </NavLink>
            </nav>
          </div>
          <div className="flex items-center gap-2 text-sm">
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
              to="/"
              className={isDark ? "text-[#9ca3af] hover:text-[#c4b5fd]" : "text-gray-500 hover:text-[#6d28d9]"}
            >
              Volver a la tienda
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-5xl w-full mx-auto p-4">
        <Outlet />
      </main>
    </div>
  );
}
