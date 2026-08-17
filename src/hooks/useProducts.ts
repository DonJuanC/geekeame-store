import { useContext } from "react";
import { ProductsContext } from "../contexts/ProductsContext";

export function useProducts() {
  const ctx = useContext(ProductsContext);
  if (!ctx)
    throw new Error("useProducts debe usarse dentro de <ProductsProvider>");
  return ctx;
}
