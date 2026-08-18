import { Link, NavLink, Outlet } from "react-router-dom";

// Layout dedicado del panel admin: navegación y look & feel separados por
// completo de la tienda pública. Las rutas hijas (listado, alta, edición)
// se inyectan en <Outlet />.
export function AdminLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-gray-900 text-white">
        <div className="max-w-5xl mx-auto p-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="font-bold">Geekeame · Admin</span>
            <nav className="flex gap-4 text-sm">
              <NavLink
                to="/admin"
                end
                className={({ isActive }) =>
                  isActive ? "underline" : "text-gray-300"
                }
              >
                Productos
              </NavLink>
              <NavLink
                to="/admin/orders"
                className={({ isActive }) =>
                  isActive ? "underline" : "text-gray-300"
                }
              >
                Pedidos
              </NavLink>
              <NavLink
                to="/admin/analytics"
                className={({ isActive }) =>
                  isActive ? "underline" : "text-gray-300"
                }
              >
                Analytics
              </NavLink>
            </nav>
          </div>
          <Link to="/" className="text-sm text-gray-300 underline">
            Volver a la tienda
          </Link>
        </div>
      </header>
      <main className="flex-1 max-w-5xl w-full mx-auto p-4">
        <Outlet />
      </main>
    </div>
  );
}
