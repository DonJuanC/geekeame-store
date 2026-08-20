import { createContext, useContext } from "react";
import type { FavoriteList } from "../types/favoriteList";

export type FavoritesStatus = "idle" | "loading" | "error";

export interface FavoritesContextValue {
  list: FavoriteList | null;
  status: FavoritesStatus;
  error: string | null;
  isFavorited: (productId: string) => boolean;
  toggleFavorite: (productId: string) => Promise<void>;
}

export const FavoritesContext = createContext<FavoritesContextValue | undefined>(
  undefined,
);

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites debe usarse dentro de <FavoritesProvider>");
  return ctx;
}
