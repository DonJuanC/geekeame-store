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
      className={`flex flex-col items-center gap-3 p-8 text-center ${
        dark ? "text-[#f87171]" : "text-red-600"
      }`}
    >
      <p>{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className={`border rounded px-4 py-2 text-sm ${
            dark ? "border-[#3f3a5c] text-[#c4b5fd]" : ""
          }`}
        >
          Reintentar
        </button>
      )}
    </div>
  );
}
