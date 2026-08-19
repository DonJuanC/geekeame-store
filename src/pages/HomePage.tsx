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
import type { Product } from "../types/product";

// Cantidad de productos en "Destacados". No hay flag de "featured" en
// Firestore todavía, así que sigue siendo un recorte de "products" (vista
// por defecto, ya ordenada por createdAt desc -- ver listProducts), no una
// curación manual.
const FEATURED_COUNT = 6;

// Antes era un slice directo de los primeros FEATURED_COUNT: si varios
// productos seguidos se habían cargado de la misma categoría (típico
// después de un seed por lotes), "Destacados" terminaba siendo 6 productos
// de una sola categoría en vez de una vitrina. Acá se toma como mucho un
// producto por categoría en una primera pasada (el más reciente de cada
// una, porque "products" ya viene ordenado por createdAt desc) y recién si
// sobran cupos -- hay menos categorías que FEATURED_COUNT -- se completa
// con los siguientes productos más recientes que todavía no entraron.
export function pickFeaturedProducts(
  products: Product[],
  count: number,
): Product[] {
  const seenCategories = new Set<string>();
  const featured: Product[] = [];

  for (const product of products) {
    if (featured.length >= count) break;
    if (seenCategories.has(product.categoryId)) continue;
    seenCategories.add(product.categoryId);
    featured.push(product);
  }

  if (featured.length < count) {
    const featuredIds = new Set(featured.map((p) => p.id));
    for (const product of products) {
      if (featured.length >= count) break;
      if (featuredIds.has(product.id)) continue;
      featured.push(product);
    }
  }

  return featured;
}

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
  const featured = pickFeaturedProducts(products, FEATURED_COUNT);

  return (
    <div className={`min-h-screen ${isDark ? "bg-[#0f0e17]" : "bg-white"}`}>
      <StoreHeader />

      {isDefaultView && <HeroSection />}

      {/* <main> en vez de <div>: ninguna página de cliente tenía landmark
          semántico (comparar con AdminLayout, que sí usa <main>) -- un
          usuario que navega por landmarks no tenía forma de saltar directo
          al contenido principal. */}
      <main className="p-4 max-w-5xl mx-auto">
        {/* Sin esto, al buscar/filtrar no quedaba ningún heading en pantalla
            -- ni el h1 del hero ni el h2 "Destacados" se montan fuera de la
            vista landing. Solo cuando NO es landing: el hero ya trae su
            propio h1, y tener dos sería redundante. */}
        {!isDefaultView && <h1 className="sr-only">Catálogo</h1>}

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
            aria-label="Buscar productos"
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
              aria-pressed={categoryId === null}
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
                aria-pressed={categoryId === c.id}
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
          <EmptyState
            message="No encontramos productos que coincidan."
            actionLabel={
              categoryId !== null || searchInput !== "" ? "Limpiar filtros" : undefined
            }
            onAction={
              categoryId !== null || searchInput !== ""
                ? () => {
                    setCategoryId(null);
                    setSearchInput("");
                  }
                : undefined
            }
            dark={isDark}
          />
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
                  className="rounded-full bg-[#7c3aed] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#6d28d9] disabled:opacity-50 transition-colors"
                >
                  {isLoadingMore ? "Cargando..." : "Cargar más"}
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
