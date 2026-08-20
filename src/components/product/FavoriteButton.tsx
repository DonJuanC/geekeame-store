import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useFavorites } from "../../hooks/useFavorites";
import { useTheme } from "../../hooks/useTheme";

interface FavoriteButtonProps {
  productId: string;
  className?: string;
}

export function FavoriteButton({ productId, className = "" }: FavoriteButtonProps) {
  const { user } = useAuth();
  const { isFavorited, toggleFavorite } = useFavorites();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [pending, setPending] = useState(false);
  const [toggleError, setToggleError] = useState<string | null>(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  if (!user) {
    return (
      <span className={`inline-block ${className}`}>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setShowLoginPrompt((current) => !current);
          }}
          aria-label="Inicia sesión para guardar favoritos"
          aria-expanded={showLoginPrompt}
          title="Inicia sesión para guardar favoritos"
          className={`rounded-full w-9 h-9 flex items-center justify-center text-lg transition-transform hover:scale-110 ${
            isDark ? "bg-[#161320]/80" : "bg-white/80"
          }`}
        >
          🤍
        </button>
        {showLoginPrompt && (
          <div
            role="dialog"
            aria-label="Inicia sesión para guardar favoritos"
            onClick={(e) => e.stopPropagation()}
            className={`absolute top-full right-0 mt-1 w-44 rounded-lg p-2.5 text-xs shadow-lg z-20 ${
              isDark
                ? "bg-[#211d34] text-[#f5f3ff]"
                : "bg-white text-[#1a1625] border border-[#ede9fe]"
            }`}
          >
            <p className="mb-2">Inicia sesión para guardar favoritos.</p>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowLoginPrompt(false);
                }}
                className={isDark ? "text-[#9ca3af]" : "text-gray-500"}
              >
                Cancelar
              </button>
              <Link
                to="/login"
                onClick={(e) => e.stopPropagation()}
                className={`font-medium ${isDark ? "text-[#c4b5fd]" : "text-[#6d28d9]"}`}
              >
                Ir a login
              </Link>
            </div>
          </div>
        )}
      </span>
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
      console.error(err);
      setToggleError("No se pudo actualizar. Intenta de nuevo.");
    } finally {
      setPending(false);
    }
  }

  return (
    <span className={`inline-block ${className}`}>
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        aria-label={favorited ? "Quitar de favoritos" : "Agregar a favoritos"}
        title={favorited ? "En tus favoritos" : "Agregar a favoritos"}
        className={`rounded-full w-9 h-9 flex items-center justify-center text-lg transition-transform hover:scale-110 disabled:opacity-60 ${
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
