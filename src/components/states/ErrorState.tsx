interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
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
