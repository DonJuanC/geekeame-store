const STARS = [1, 2, 3, 4, 5];

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  readOnly?: boolean;
  size?: "sm" | "md";
  dark?: boolean;
}

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
