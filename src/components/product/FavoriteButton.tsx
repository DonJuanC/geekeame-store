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
    try {
      await toggleFavorite(productId);
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      aria-label={favorited ? "Quitar de favoritos" : "Agregar a favoritos"}
      title={favorited ? "En tus favoritos" : "Agregar a favoritos"}
      className={`rounded-full w-8 h-8 flex items-center justify-center text-lg transition-transform hover:scale-110 disabled:opacity-60 ${
        isDark ? "bg-[#161320]/80" : "bg-white/80"
      } ${className}`}
    >
      {favorited ? "❤️" : "🤍"}
    </button>
  );
}
