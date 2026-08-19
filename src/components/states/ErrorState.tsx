interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
  // Ver nota en LoadingState.tsx: opcional, false por defecto, solo Home
  // lo pasa hoy.
  dark?: boolean;
}

export function ErrorState({ message, onRetry, dark = false }: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={`flex flex-col items-center gap-3 p-8 text-center ${
        dark ? "text-[#f87171]" : "text-red-600"
      }`}
    >
      <p>{message}</p>
      {onRetry && (
        // rounded-full + color violeta explícito: antes era rounded (radio
        // chico) y sin color en modo claro, cayendo al estilo por defecto
        // del navegador -- justo en el momento de un error, donde más
        // importa que la recuperación se vea confiable, no "sin estilizar".
        <button
          onClick={onRetry}
          className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
            dark
              ? "border-[#3f3a5c] text-[#c4b5fd] hover:bg-[#211d34]"
              : "border-[#ddd6fe] text-[#6d28d9] hover:bg-[#f5f3ff]"
          }`}
        >
          Reintentar
        </button>
      )}
    </div>
  );
}
