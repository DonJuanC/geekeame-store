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
  const [rawList, setRawList] = useState<FavoriteList | null>(null);
  const [resolvedStatus, setResolvedStatus] = useState<"idle" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  // Usuario para el que rawList/resolvedStatus ya son válidos -- "never"
  // antes de la primera resolución. list/status de abajo se derivan de esto
  // (igual que loadedParams en ProductsContext) en vez de resetear con
  // setList(null)/setStatus(...) síncrono al arrancar el efecto, que
  // dispara react-hooks/set-state-in-effect.
  const [loadedForUser, setLoadedForUser] = useState<typeof user | "never">(
    "never",
  );

  const runFetch = useCallback(() => {
    if (!user) return; // nada que buscar -- list/status de abajo ya cubren este caso
    return getOrCreateFavoriteList(user.uid)
      .then((result) => {
        setRawList(result);
        setResolvedStatus("idle");
        setError(null);
        setLoadedForUser(user);
      })
      .catch((err) => {
        console.error(err);
        setError("No pudimos cargar tus favoritos.");
        setResolvedStatus("error");
        setLoadedForUser(user);
      });
  }, [user]);

  useEffect(() => {
    runFetch();
  }, [runFetch]);

  // Wrapper con nombre estable para toggleFavorite (evento, no efecto) --
  // ningún consumidor de "status" depende de que se ponga "loading" apenas
  // se llama (FavoriteButton usa su propio "pending" local, y FavoritesPage
  // no parpadea entre refetch y la próxima carga -- ver comentario de
  // "list" ahí), así que reusa runFetch tal cual.
  function refetch() {
    void runFetch();
  }

  const isLoading = user ? loadedForUser !== user : false;
  // Mientras isLoading, list se queda con el valor previo (rawList stale)
  // en vez de resetear a null -- mismo comportamiento que antes: cambiar de
  // usuario no vaciaba la lista de golpe, solo status pasaba a "loading".
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
