import { useEffect, useState, type ReactNode } from "react";
import { listProducts } from "../services/productsService";
import type { Product } from "../types/product";
import { ProductsContext, type ProductsStatus } from "../hooks/useProducts";

type ResolvedStatus = Exclude<ProductsStatus, "loading">;

interface LoadedParams {
  categoryId: string | null;
  searchTerm: string;
}

export function ProductsProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [resolvedStatus, setResolvedStatus] =
    useState<ResolvedStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  // Parámetros para los que "products"/resolvedStatus ya son válidos.
  // Mientras no coincidan con categoryId/debouncedSearch actuales seguimos
  // "cargando" -- se deriva más abajo (isLoading) en vez de resetear con un
  // setStatus("loading") síncrono al arrancar el efecto, que dispara
  // react-hooks/set-state-in-effect. Mismo patrón que AdminProductsPage,
  // AdminOrdersPage, AdminProductFormPage y ProductDetailPage.
  const [loadedParams, setLoadedParams] = useState<LoadedParams | null>(null);

  useEffect(() => {
    const timeoutId = setTimeout(() => setDebouncedSearch(searchInput), 400);
    return () => clearTimeout(timeoutId);
  }, [searchInput]);

  useEffect(() => {
    let cancelled = false;
    listProducts({ categoryId, searchTerm: debouncedSearch })
      .then((result) => {
        if (cancelled) return;
        setProducts(result);
        setResolvedStatus("idle");
        setError(null);
        setLoadedParams({ categoryId, searchTerm: debouncedSearch });
      })
      .catch((err) => {
        if (cancelled) return;
        console.error(err);
        setError("No pudimos cargar los productos. Intenta de nuevo.");
        setResolvedStatus("error");
        setLoadedParams({ categoryId, searchTerm: debouncedSearch });
      });
    return () => {
      cancelled = true;
    };
  }, [categoryId, debouncedSearch]);

  const isLoading =
    loadedParams === null ||
    loadedParams.categoryId !== categoryId ||
    loadedParams.searchTerm !== debouncedSearch;

  const status: ProductsStatus = isLoading ? "loading" : resolvedStatus;

  return (
    <ProductsContext.Provider
      value={{
        products,
        status,
        error,
        categoryId,
        searchInput,
        setCategoryId,
        setSearchInput,
      }}
    >
      {children}
    </ProductsContext.Provider>
  );
}
