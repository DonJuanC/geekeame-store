import { useProducts } from "../hooks/useProducts";
import { useTheme } from "../hooks/useTheme";
import { ProductCard } from "../components/product/ProductCard";
import { StoreHeader } from "../components/layout/StoreHeader";
import { LoadingState } from "../components/states/LoadingState";
import { EmptyState } from "../components/states/EmptyState";
import { ErrorState } from "../components/states/ErrorState";
import { PRODUCT_CATEGORIES } from "../constants/categories";

export function HomePage() {
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
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div className={`min-h-screen ${isDark ? "bg-[#0f0e17]" : "bg-white"}`}>
      <StoreHeader />

      <div className="p-4 max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <input
            type="search"
            placeholder="Buscar por nombre..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className={`rounded-full px-4 py-2 flex-1 border focus:outline-none focus:ring-2 focus:ring-[#c4b5fd] ${
              isDark
                ? "bg-[#161320] border-[#2e2a45] text-[#f5f3ff] placeholder:text-[#6b6485]"
                : "border-[#ede9fe]"
            }`}
          />
          <div className="flex gap-2 overflow-x-auto">
            <button
              onClick={() => setCategoryId(null)}
              className={`rounded-full border px-3 py-1 text-sm whitespace-nowrap transition-colors ${
                categoryId === null
                  ? "bg-[#7c3aed] border-[#7c3aed] text-white"
                  : isDark
                    ? "border-[#2e2a45] text-[#c4b5fd] hover:bg-[#211d34]"
                    : "border-[#ede9fe] text-[#1a1625] hover:bg-[#f5f3ff]"
              }`}
            >
              Todas
            </button>
            {PRODUCT_CATEGORIES.map((c) => (
              <button
                key={c.id}
                onClick={() => setCategoryId(c.id)}
                className={`rounded-full border px-3 py-1 text-sm whitespace-nowrap transition-colors ${
                  categoryId === c.id
                    ? "bg-[#7c3aed] border-[#7c3aed] text-white"
                    : isDark
                      ? "border-[#2e2a45] text-[#c4b5fd] hover:bg-[#211d34]"
                      : "border-[#ede9fe] text-[#1a1625] hover:bg-[#f5f3ff]"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {status === "loading" && (
          <LoadingState label="Cargando productos..." dark={isDark} />
        )}
        {status === "error" && (
          <ErrorState message={error ?? "Algo salió mal."} dark={isDark} />
        )}
        {status === "idle" && products.length === 0 && (
          <EmptyState message="No encontramos productos que coincidan." dark={isDark} />
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
                  <p className={isDark ? "text-[#f87171] text-sm" : "text-red-600 text-sm"}>
                    {loadMoreError}
                  </p>
                )}
                <button
                  onClick={loadMore}
                  disabled={isLoadingMore}
                  className="rounded-full bg-[#7c3aed] px-5 py-2 text-sm font-medium text-white hover:bg-[#6d28d9] disabled:opacity-50 transition-colors"
                >
                  {isLoadingMore ? "Cargando..." : "Cargar más"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
