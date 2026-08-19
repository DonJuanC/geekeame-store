const STARS = [1, 2, 3, 4, 5];

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  readOnly?: boolean;
  size?: "sm" | "md";
  // Estrellas vacías: text-gray-300 (gris clarito) se ve casi blanco --
  // como si estuviera "llena" -- contra el fondo oscuro (#0f0e17), así que
  // en dark mode usa un tono violeta apagado que sí lee como "vacío".
  dark?: boolean;
}

// Un solo componente para los dos casos de uso (promedio de solo lectura +
// selector interactivo del formulario): en modo interactivo cada estrella
// es un <button>, en modo lectura son <span> -- así el promedio (que puede
// no ser un entero, ej. 4.3) no queda "clickeable" por accidente.
export function StarRating({
  value,
  onChange,
  readOnly = false,
  size = "md",
  dark = false,
}: StarRatingProps) {
  const sizeClass = size === "sm" ? "text-base" : "text-2xl";
  const filledUpTo = Math.round(value);
  const emptyClass = dark ? "text-[#4b4566]" : "text-gray-300";

  if (readOnly) {
    return (
      <span
        className={`${sizeClass} leading-none`}
        aria-label={`${value.toFixed(1)} de 5 estrellas`}
      >
        {STARS.map((star) => (
          <span
            key={star}
            className={star <= filledUpTo ? "text-yellow-500" : emptyClass}
          >
            ★
          </span>
        ))}
      </span>
    );
  }

  return (
    // role="group" con botones simples, no "radiogroup": ese rol implica el
    // patrón de teclado con flechas + roving tabindex, que acá no está
    // implementado (cada estrella es un tab-stop normal). Mejor un grupo
    // simple que anunciar un patrón que no se cumple.
    <span className={`${sizeClass} leading-none`} role="group" aria-label="Calificación">
      {STARS.map((star) => (
        <button
          key={star}
          type="button"
          aria-pressed={star <= value}
          aria-label={`${star} estrella${star > 1 ? "s" : ""}`}
          onClick={() => onChange?.(star)}
          className={
            star <= value
              ? "text-yellow-500 hover:text-yellow-600"
              : `${emptyClass} hover:text-yellow-400`
          }
        >
          ★
        </button>
      ))}
    </span>
  );
}
