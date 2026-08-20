import { useEffect, useState } from "react";
import { useProducts } from "../hooks/useProducts";
import { useTheme } from "../hooks/useTheme";
import { ProductGrid } from "../components/product/ProductGrid";
import { StoreHeader } from "../components/layout/StoreHeader";
import { HeroSection } from "../components/home/HeroSection";
import { CategoryTiles } from "../components/home/CategoryTiles";
import { LoadingState } from "../components/states/LoadingState";
import { EmptyState } from "../components/states/EmptyState";
import { ErrorState } from "../components/states/ErrorState";
import { PRODUCT_CATEGORIES } from "../constants/categories";
import { listFeaturedCandidates } from "../services/productsService";
import { interleaveByCategory } from "../utils/interleaveByCategory";
import type { Product } from "../types/product";

// Cantidad de productos en "Destacados". No hay flag de "featured" en
// Firestore todavía, así que sigue siendo automático a partir de lo más
// reciente, no una curación manual.
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

  // Destacados se resuelve aparte de "products" (que es la vista paginada
  // del catálogo, category=null) -- ver interleaveByCategory arriba para
  // el motivo. Falla silenciosa a propósito: es una vitrina decorativa, si
  // la carga falla simplemente no se muestra la sección en vez de romper
  // el resto del home.
  const [featured, setFeatured] = useState<Product[]>([]);

  useEffect(() => {
    let cancelled = false;
    listFeaturedCandidates(2)
      .then((groups) => {
        if (cancelled) return;
        setFeatured(interleaveByCategory(groups, FEATURED_COUNT));
      })
      .catch((err) => {
        console.error(err);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Vista "landing": el hero/tiles/destacados son bienvenida, no catálogo.
  // showLanding (ProductsContext) es un flag aparte de categoryId/
  // searchInput -- "Todas" también deja categoryId en null pero debe
  // quedarse en el catálogo, no traer de vuelta el hero (ver la nota en
  // ProductsContext.tsx). Se ocultan en vez de convivir con el resto para
  // no repetir productos dos veces en pantalla sin motivo.
  const isDefaultView = showLanding;

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

        {isDefaultView && featured.length > 0 && (
          <div className="mb-10">
            <h2
              className={`font-['Fredoka'] text-xl font-semibold mb-3 ${
                isDark ? "text-[#f5f3ff]" : "text-[#1a1625]"
              }`}
            >
              Destacados
            </h2>
            <ProductGrid products={featured} />
          </div>
        )}

        {isDefaultView && featured.length > 0 && (
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
            <ProductGrid products={products} />

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
