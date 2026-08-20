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
  // Antes el corazón sin sesión era un <Link> que navegaba a /login apenas
  // se lo tocaba -- sin aviso ni forma de cancelar, un click accidental (o
  // por curiosidad) sacaba al usuario del catálogo sin preguntar. Ahora
  // muestra un mensaje con la opción de cancelar antes de ir a login.
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  if (!user) {
    return (
      // Sin "relative" acá por el mismo motivo que el wrapper de abajo (ver
      // nota más adelante): el mensaje se posiciona "absolute" contra el
      // ancestro con position del caller (ProductCard/ProductDetailPage).
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
    // Sin "relative" acá: el className del caller siempre trae "absolute"
    // (ProductCard/ProductDetailPage), y Tailwind resuelve el conflicto
    // relative+absolute a favor de "relative" en el CSS generado -- eso
    // sacaba el corazón de su posición absoluta en la esquina de la tarjeta
    // y lo dejaba flotando en el flujo normal, semi-afuera del recuadro.
    // "absolute" ya alcanza como positioning context para el mensaje de
    // error de abajo.
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
