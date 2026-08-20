import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useAuth } from "../hooks/useAuth";
import { FavoritesContext } from "../hooks/useFavorites";
import type { FavoriteList } from "../types/favoriteList";
import {
  addProductToList,
  getOrCreateFavoriteList,
  removeProductFromList,
} from "../services/favoritesService";

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [rawList, setRawList] = useState<FavoriteList | null>(null);
  const [resolvedStatus, setResolvedStatus] = useState<"idle" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [loadedForUser, setLoadedForUser] = useState<typeof user | "never">(
    "never",
  );
  const requestUidRef = useRef<string | null>(null);

  const runFetch = useCallback(() => {
    if (!user) {
      requestUidRef.current = null;
      return;
    }
    const requestUid = user.uid;
    requestUidRef.current = requestUid;
    return getOrCreateFavoriteList(user.uid)
      .then((result) => {
        if (requestUidRef.current !== requestUid) return;
        setRawList(result);
        setResolvedStatus("idle");
        setError(null);
        setLoadedForUser(user);
      })
      .catch((err) => {
        if (requestUidRef.current !== requestUid) return;
        console.error(err);
        setError("No pudimos cargar tus favoritos.");
        setResolvedStatus("error");
        setLoadedForUser(user);
      });
  }, [user]);

  useEffect(() => {
    runFetch();
  }, [runFetch]);

  function refetch() {
    void runFetch();
  }

  const isLoading = user ? loadedForUser !== user : false;
  const list = user ? rawList : null;
  const status: "idle" | "loading" | "error" = !user
    ? "idle"
    : isLoading
      ? "loading"
      : resolvedStatus;

  function isFavorited(productId: string): boolean {
    return list?.productIds.includes(productId) ?? false;
  }

  async function toggleFavorite(productId: string) {
    if (!user) throw new Error("No hay sesión activa.");
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
