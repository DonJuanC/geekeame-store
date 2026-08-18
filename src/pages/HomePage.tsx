import { useProducts } from "../hooks/useProducts";
import { useTheme } from "../hooks/useTheme";
import { ProductCard } from "../components/product/ProductCard";
import { StoreHeader } from "../components/layout/StoreHeader";
import { HeroSection } from "../components/home/HeroSection";
import { CategoryTiles } from "../components/home/CategoryTiles";
import { LoadingState } from "../components/states/LoadingState";
import { EmptyState } from "../components/states/EmptyState";
import { ErrorState } from "../components/states/ErrorState";
import { PRODUCT_CATEGORIES } from "../constants/categories";

// Cantidad de productos en "Destacados": simple slice de los primeros N de
// products (que en la vista por defecto ya vienen ordenados por
// createdAt desc -- ver listProducts), no un flag de "featured" en
// Firestore. No hay campo para eso todavía; esto es "recién llegados"
// presentado como vitrina, no una curación manual.
const FEATURED_COUNT = 6;

export function HomePage() {
  const {
    products,
    status,
    error,
    categoryId,
    searchInput,
    setCategoryId,
    setSearchInput,
    showLanding,
    hasMore,
    isLoadingMore,
    loadMoreError,
    loadMore,
  } = useProducts();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // Vista "landing": el hero/tiles/destacados son bienvenida, no catálogo.
  // showLanding (ProductsContext) es un flag aparte de categoryId/
  // searchInput -- "Todas" también deja categoryId en null pero debe
  // quedarse en el catálogo, no traer de vuelta el hero (ver la nota en
  // ProductsContext.tsx). Se ocultan en vez de convivir con el resto para
  // no repetir productos dos veces en pantalla sin motivo.
  const isDefaultView = showLanding;
  const featured = products.slice(0, FEATURED_COUNT);

  return (
    <div className={`min-h-screen ${isDark ? "bg-[#0f0e17]" : "bg-white"}`}>
      <StoreHeader />

      {isDefaultView && <HeroSection />}

      <div className="p-4 max-w-5xl mx-auto">
        {isDefaultView && (
          <div className="mb-8">
            <CategoryTiles onSelect={setCategoryId} dark={isDark} />
          </div>
        )}

        {isDefaultView && status === "idle" && featured.length > 0 && (
          <div className="mb-10">
            <h2
              className={`font-['Fredoka'] text-xl font-semibold mb-3 ${
                isDark ? "text-[#f5f3ff]" : "text-[#1a1625]"
              }`}
            >
              Destacados
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {featured.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}

        {isDefaultView && status === "idle" && featured.length > 0 && (
          <div className="flex items-center gap-3 mb-6" aria-hidden="true">
            <span className={`h-px flex-1 ${isDark ? "bg-[#2e2a45]" : "bg-[#ede9fe]"}`} />
            <span
              className={`text-xs font-medium uppercase tracking-wide ${
                isDark ? "text-[#6b6485]" : "text-[#9ca3af]"
              }`}
            >
              Catálogo completo
            </span>
            <span className={`h-px flex-1 ${isDark ? "bg-[#2e2a45]" : "bg-[#ede9fe]"}`} />
          </div>
        )}

        <div id="catalogo" className="flex flex-col sm:flex-row gap-3 mb-6 scroll-mt-20">
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
