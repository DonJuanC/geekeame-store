import { createContext, useEffect, useState, type ReactNode } from "react";
import { listProducts } from "../services/productsService";
import type { Product } from "../types/product";

type Status = "idle" | "loading" | "error";

interface ProductsContextValue {
  products: Product[];
  status: Status;
  error: string | null;
  categoryId: string | null;
  searchInput: string;
  setCategoryId: (id: string | null) => void;
  setSearchInput: (term: string) => void;
}

export const ProductsContext = createContext<ProductsContextValue | undefined>(
  undefined,
);

export function ProductsProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timeoutId = setTimeout(() => setDebouncedSearch(searchInput), 400);
    return () => clearTimeout(timeoutId);
  }, [searchInput]);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    setError(null);
    listProducts({ categoryId, searchTerm: debouncedSearch })
      .then((result) => {
        if (cancelled) return;
        setProducts(result);
        setStatus("idle");
      })
      .catch((err) => {
        if (cancelled) return;
        console.error(err);
        setError("No pudimos cargar los productos. Intenta de nuevo .");
        setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [categoryId, debouncedSearch]);

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
