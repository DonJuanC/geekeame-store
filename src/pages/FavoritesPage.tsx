import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "../hooks/useTheme";
import { useFavorites } from "../hooks/useFavorites";
import { StoreHeader } from "../components/layout/StoreHeader";
import { LoadingState } from "../components/states/LoadingState";
import { ErrorState } from "../components/states/ErrorState";
import { EmptyState } from "../components/states/EmptyState";
import { ProductImage } from "../components/product/ProductImage";
import { getProductById } from "../services/productsService";
import { categoryLabel, themeName } from "../utils/productDisplay";
import type { Product } from "../types/product";

export function FavoritesPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { list, status, error, toggleFavorite } = useFavorites();
  const [products, setProducts] = useState<Product[] | null>(null);

  // Se resuelven acá (no en el contexto) porque la lista solo guarda
  // productIds -- traer el Product completo de cada uno es responsabilidad
  // de la página que efectivamente lo va a mostrar.
  useEffect(() => {
    if (!list) {
      setProducts(null);
      return;
    }
    let cancelled = false;
    Promise.all(list.productIds.map((id) => getProductById(id))).then((results) => {
      if (cancelled) return;
      setProducts(results.filter((p): p is Product => p !== null));
    });
    return () => {
      cancelled = true;
    };
  }, [list]);

  const isLoading = status === "loading" || (status === "idle" && list && products === null);

  return (
    <div className={`min-h-screen ${isDark ? "bg-[#0f0e17] text-[#f5f3ff]" : "bg-white"}`}>
      <StoreHeader />
      <div className="p-4 max-w-2xl mx-auto">
        <Link
          to="/"
          className={`text-sm font-medium ${
            isDark ? "text-[#c4b5fd] hover:text-[#a78bfa]" : "text-[#6d28d9] hover:text-[#4c1d95]"
          }`}
        >
          ← Volver al catálogo
        </Link>
        <h1 className="text-xl font-bold my-4">Mis favoritos</h1>

        {isLoading && <LoadingState label="Cargando tus favoritos..." dark={isDark} />}
        {status === "error" && (
          <ErrorState message={error ?? "No pudimos cargar tus favoritos."} dark={isDark} />
        )}
        {!isLoading && status === "idle" && products !== null && products.length === 0 && (
          <EmptyState
            message="Todavía no tienes favoritos. Agrégalos desde el catálogo tocando el corazón (❤️) de cualquier producto."
            dark={isDark}
          />
        )}

        {!isLoading && products !== null && products.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {products.map((product) => (
              <div
                key={product.id}
                className={`relative rounded-lg border overflow-hidden ${
                  isDark ? "border-[#2e2a45]" : "border-[#ede9fe]"
                }`}
              >
                <button
                  onClick={() => toggleFavorite(product.id)}
                  title="Quitar de favoritos"
                  aria-label={`Quitar ${themeName(product)} de favoritos`}
                  className={`absolute top-1 right-1 z-10 rounded-full w-6 h-6 flex items-center justify-center text-xs ${
                    isDark ? "bg-[#161320]/90 text-[#f5f3ff]" : "bg-white/90"
                  }`}
                >
                  ✕
                </button>
                <Link to={`/products/${product.id}`}>
                  <ProductImage
                    product={product}
                    className="w-full aspect-square object-cover"
                    dark={isDark}
                  />
                  <div className="p-2">
                    <p className="text-xs font-medium line-clamp-1">{themeName(product)}</p>
                    <p className={`text-[10px] ${isDark ? "text-[#9ca3af]" : "text-gray-500"}`}>
                      {categoryLabel(product.categoryId)}
                    </p>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
