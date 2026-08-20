import { useEffect, useState, type ReactNode } from "react";
import type { DocumentData, QueryDocumentSnapshot } from "firebase/firestore";
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
  const [loadedParams, setLoadedParams] = useState<LoadedParams | null>(null);

  const [cursor, setCursor] = useState<QueryDocumentSnapshot<DocumentData> | null>(
    null,
  );
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);

  useEffect(() => {
    const timeoutId = setTimeout(() => setDebouncedSearch(searchInput), 400);
    return () => clearTimeout(timeoutId);
  }, [searchInput]);

  useEffect(() => {
    let cancelled = false;
    listProducts({ categoryId, searchTerm: debouncedSearch })
      .then((result) => {
        if (cancelled) return;
        setProducts(result.products);
        setCursor(result.nextCursor);
        setResolvedStatus("idle");
        setError(null);
        setLoadMoreError(null);
        setLoadedParams({ categoryId, searchTerm: debouncedSearch });
      })
      .catch((err) => {
        if (cancelled) return;
        console.error(err);
        setError("No pudimos cargar los productos. Intenta de nuevo.");
        setResolvedStatus("error");
        setLoadMoreError(null);
        setLoadedParams({ categoryId, searchTerm: debouncedSearch });
      });
    return () => {
      cancelled = true;
    };
  }, [categoryId, debouncedSearch]);

  const [showLanding, setShowLanding] = useState(true);

  function updateCategoryId(id: string | null) {
    setShowLanding(false);
    setCategoryId(id);
  }

  function updateSearchInput(term: string) {
    setShowLanding(false);
    setSearchInput(term);
  }

  function goToLanding() {
    setShowLanding(true);
    setCategoryId(null);
    setSearchInput("");
  }

  const isLoading =
    loadedParams === null ||
    loadedParams.categoryId !== categoryId ||
    loadedParams.searchTerm !== debouncedSearch;

  const status: ProductsStatus = isLoading ? "loading" : resolvedStatus;

  async function loadMore() {
    if (!cursor || isLoadingMore || isLoading) return;
    setIsLoadingMore(true);
    setLoadMoreError(null);
    try {
      const result = await listProducts({
        categoryId,
        searchTerm: debouncedSearch,
        cursor,
      });
      setProducts((prev) => [...prev, ...result.products]);
      setCursor(result.nextCursor);
    } catch (err) {
      console.error(err);
      setLoadMoreError("No pudimos cargar más productos. Intenta de nuevo.");
    } finally {
      setIsLoadingMore(false);
    }
  }

  return (
    <ProductsContext.Provider
      value={{
        products,
        status,
        error,
        categoryId,
        searchInput,
        setCategoryId: updateCategoryId,
        setSearchInput: updateSearchInput,
        showLanding,
        goToLanding,
        hasMore: cursor !== null,
        isLoadingMore,
        loadMoreError,
        loadMore,
      }}
    >
      {children}
    </ProductsContext.Provider>
  );
}
