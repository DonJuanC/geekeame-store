const STARS = [1, 2, 3, 4, 5];

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  readOnly?: boolean;
  size?: "sm" | "md";
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
}: StarRatingProps) {
  const sizeClass = size === "sm" ? "text-base" : "text-2xl";
  const filledUpTo = Math.round(value);

  if (readOnly) {
    return (
      <span
        className={`${sizeClass} leading-none`}
        aria-label={`${value.toFixed(1)} de 5 estrellas`}
      >
        {STARS.map((star) => (
          <span
            key={star}
            className={star <= filledUpTo ? "text-yellow-500" : "text-gray-300"}
          >
            ★
          </span>
        ))}
      </span>
    );
  }

  return (
    <span className={`${sizeClass} leading-none`} role="radiogroup" aria-label="Calificación">
      {STARS.map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={star === value}
          aria-label={`${star} estrella${star > 1 ? "s" : ""}`}
          onClick={() => onChange?.(star)}
          className={
            star <= value
              ? "text-yellow-500 hover:text-yellow-600"
              : "text-gray-300 hover:text-yellow-400"
          }
        >
          ★
        </button>
      ))}
    </span>
  );
}
