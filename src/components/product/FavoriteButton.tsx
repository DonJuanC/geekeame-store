import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useFavorites } from "../../hooks/useFavorites";
import { useTheme } from "../../hooks/useTheme";

interface FavoriteButtonProps {
  productId: string;
  // Posicionamiento a cargo del caller: en ProductCard va absolute sobre
  // la imagen, en ProductDetailPage va inline junto al precio. El botón en
  // sí no asume ninguno de los dos casos.
  className?: string;
}

// Toggle simple: un solo click agrega/quita de "Mis favoritos" (lista
// única por usuario, ver favoritesService.ts). Sin popover ni selector de
// listas -- se descartó esa versión a pedido explícito, para no meter la
// fricción de "crear/elegir lista" en algo que debería ser un click.
export function FavoriteButton({ productId, className = "" }: FavoriteButtonProps) {
  const { user } = useAuth();
  const { isFavorited, toggleFavorite } = useFavorites();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [pending, setPending] = useState(false);
  const [toggleError, setToggleError] = useState<string | null>(null);

  if (!user) {
    return (
      <Link
        to="/login"
        title="Inicia sesión para guardar favoritos"
        aria-label="Inicia sesión para guardar favoritos"
        onClick={(e) => e.stopPropagation()}
        className={`rounded-full w-8 h-8 flex items-center justify-center text-lg transition-transform hover:scale-110 ${
          isDark ? "bg-[#161320]/80" : "bg-white/80"
        } ${className}`}
      >
        🤍
      </Link>
    );
  }

  const favorited = isFavorited(productId);

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (pending) return;
    setPending(true);
    setToggleError(null);
    try {
      await toggleFavorite(productId);
    } catch (err) {
      // Antes esto fallaba en silencio: el corazón volvía a su estado
      // normal sin ningún aviso, así que el usuario no sabía si el toggle
      // no hizo nada o si tenía que reintentar. `className` (posicionamiento
      // del caller) se movió al wrapper para poder anclar este mensaje al
      // mismo punto sin romper el layout absolute de ProductCard/DetailPage.
      console.error(err);
      setToggleError("No se pudo actualizar. Intenta de nuevo.");
    } finally {
      setPending(false);
    }
  }

  return (
    <span className={`relative inline-block ${className}`}>
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        aria-label={favorited ? "Quitar de favoritos" : "Agregar a favoritos"}
        title={favorited ? "En tus favoritos" : "Agregar a favoritos"}
        className={`rounded-full w-8 h-8 flex items-center justify-center text-lg transition-transform hover:scale-110 disabled:opacity-60 ${
          isDark ? "bg-[#161320]/80" : "bg-white/80"
        }`}
      >
        {favorited ? "❤️" : "🤍"}
      </button>
      {toggleError && (
        <span
          role="alert"
          className="absolute top-full right-0 mt-1 whitespace-nowrap text-[10px] rounded-md px-2 py-1 bg-red-600 text-white shadow-lg z-20"
        >
          {toggleError}
        </span>
      )}
    </span>
  );
}
