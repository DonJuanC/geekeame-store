import { createContext, useContext } from "react";
import type { FavoriteList } from "../types/favoriteList";

export type FavoritesStatus = "idle" | "loading" | "error";

export interface FavoritesContextValue {
  // Una sola lista por usuario (ver nota en favoritesService.ts) -- null
  // mientras no hay sesión o todavía no se resolvió/creó.
  list: FavoriteList | null;
  status: FavoritesStatus;
  error: string | null;
  // true si el producto está en la lista -- decide si el corazón de
  // ProductCard/ProductDetailPage se pinta lleno o vacío.
  isFavorited: (productId: string) => boolean;
  // Agrega o quita según el estado actual. Resuelve/crea la lista on-demand
  // si todavía no existe (primer click de un usuario nuevo).
  toggleFavorite: (productId: string) => Promise<void>;
}

// Mismo motivo que AuthContext/CartContext/ProductsContext/ThemeContext:
// el Context vive en el .ts del hook, no en el .tsx del provider, para no
// romper react-refresh/only-export-components.
export const FavoritesContext = createContext<FavoritesContextValue | undefined>(
  undefined,
);

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites debe usarse dentro de <FavoritesProvider>");
  return ctx;
}
