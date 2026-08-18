interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 p-8 text-center text-red-600">
      <p>{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="border rounded px-4 py-2 text-sm">
          Reintentar
        </button>
      )}
    </div>
  );
}
