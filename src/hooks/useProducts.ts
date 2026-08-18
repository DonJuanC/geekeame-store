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
}

// Mismo motivo que AuthContext/CartContext: el Context vive en el .ts del
// hook, no en el .tsx del provider, para no romper
// react-refresh/only-export-components.
export const ProductsContext = createContext<
  ProductsContextValue | undefined
>(undefined);

export function useProducts() {
  const ctx = useContext(ProductsContext);
  if (!ctx)
    throw new Error("useProducts debe usarse dentro de <ProductsProvider>");
  return ctx;
}
