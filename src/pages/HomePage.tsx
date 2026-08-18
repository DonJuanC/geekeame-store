import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useProducts } from "../hooks/useProducts";
import { ProductCard } from "../components/product/ProductCard";
import { LoadingState } from "../components/states/LoadingState";
import { EmptyState } from "../components/states/EmptyState";
import { ErrorState } from "../components/states/ErrorState";
import { useCart } from "../hooks/useCart";

const CATEGORIES = [
  { id: "pines", label: "Pines" },
  { id: "stickers", label: "Stickers" },
  { id: "cuadros-punto-cruz", label: "Cuadros punto de cruz" },
  { id: "llaveros", label: "Llaveros" },
  { id: "tazas", label: "Tazas" },
];

export function HomePage() {
  const { user, signOut } = useAuth();
  const {
    products,
    status,
    error,
    categoryId,
    searchInput,
    setCategoryId,
    setSearchInput,
    hasMore,
    isLoadingMore,
    loadMoreError,
    loadMore,
  } = useProducts();
  const { items } = useCart();
  const cartCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">Geekeame</h1>
        {user ? (
          <div className="text-sm flex items-center gap-3">
            <span>{user.email}</span>
            <button
              onClick={() => signOut()}
              className="border rounded px-3 py-1"
            >
              Salir
            </button>
          </div>
        ) : (
          <Link to="/login" className="border rounded px-3 py-1 text-sm">
            Iniciar sesión
          </Link>
        )}

        <Link to="/cart" className="border rounded px-3 py-1 text-sm">
          Carrito ({cartCount})
        </Link>

        {user && (
          <Link to="/orders" className="border rounded px-3 py-1 text-sm">
            Mis pedidos
          </Link>
        )}
      </header>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="search"
          placeholder="Buscar por nombre..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="border rounded p-2 flex-1"
        />
        <div className="flex gap-2 overflow-x-auto">
          <button
            onClick={() => setCategoryId(null)}
            className={`border rounded px-3 py-1 text-sm whitespace-nowrap ${categoryId === null ? "bg-black text-white" : ""}`}
          >
            Todas
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => setCategoryId(c.id)}
              className={`border rounded px-3 py-1 text-sm whitespace-nowrap ${categoryId === c.id ? "bg-black text-white" : ""}`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {status === "loading" && <LoadingState label="Cargando productos..." />}
      {status === "error" && (
        <ErrorState message={error ?? "Algo salió mal."} />
      )}
      {status === "idle" && products.length === 0 && (
        <EmptyState message="No encontramos productos que coincidan." />
      )}
      {status === "idle" && products.length > 0 && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>

          {hasMore && (
            <div className="flex flex-col items-center gap-2 mt-6">
              {loadMoreError && (
                <p className="text-red-600 text-sm">{loadMoreError}</p>
              )}
              <button
                onClick={loadMore}
                disabled={isLoadingMore}
                className="border rounded px-4 py-2 text-sm disabled:opacity-50"
              >
                {isLoadingMore ? "Cargando..." : "Cargar más"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
