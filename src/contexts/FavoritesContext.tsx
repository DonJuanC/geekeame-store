import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useAuth } from "../hooks/useAuth";
import { FavoritesContext } from "../hooks/useFavorites";
import type { FavoriteList } from "../types/favoriteList";
import {
  addProductToList,
  getOrCreateFavoriteList,
  removeProductFromList,
} from "../services/favoritesService";

// Depende de useAuth() -- en main.tsx tiene que quedar ANIDADO dentro de
// <AuthProvider>, igual que ProductReviews depende de tener useAuth ya
// resuelto para saber de quién es la lista a traer.
export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [list, setList] = useState<FavoriteList | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(() => {
    if (!user) {
      setList(null);
      setStatus("idle");
      return;
    }
    setStatus("loading");
    setError(null);
    getOrCreateFavoriteList(user.uid)
      .then((result) => {
        setList(result);
        setStatus("idle");
      })
      .catch((err) => {
        console.error(err);
        setError("No pudimos cargar tus favoritos.");
        setStatus("error");
      });
  }, [user]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  function isFavorited(productId: string): boolean {
    return list?.productIds.includes(productId) ?? false;
  }

  async function toggleFavorite(productId: string) {
    if (!user) throw new Error("No hay sesión activa.");
    // Si "list" todavía no se resolvió en el estado (ej. primer click
    // apenas montado el provider) se resuelve/crea acá mismo -- evita que
    // el click quede sin efecto por una carrera con el efecto de arriba.
    const current = list ?? (await getOrCreateFavoriteList(user.uid));
    const already = current.productIds.includes(productId);
    if (already) {
      await removeProductFromList(current.id, productId);
    } else {
      await addProductToList(current.id, productId);
    }
    refetch();
  }

  return (
    <FavoritesContext.Provider value={{ list, status, error, isFavorited, toggleFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
}
