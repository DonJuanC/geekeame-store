import { createContext, useContext } from "react";
import type { Product } from "../types/product";

export type ProductsStatus = "idle" | "loading" | "error";

export interface ProductsContextValue {
  products: Product[];
  status: ProductsStatus;
  error: string | null;
  categoryId: string | null;
  searchInput: string;
  setCategoryId: (id: string | null) => void;
  setSearchInput: (term: string) => void;
  showLanding: boolean;
  goToLanding: () => void;
  hasMore: boolean;
  isLoadingMore: boolean;
  loadMoreError: string | null;
  loadMore: () => void;
}

export const ProductsContext = createContext<
  ProductsContextValue | undefined
>(undefined);

export function useProducts() {
  const ctx = useContext(ProductsContext);
  if (!ctx)
    throw new Error("useProducts debe usarse dentro de <ProductsProvider>");
  return ctx;
}
