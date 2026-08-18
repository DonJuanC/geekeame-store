interface EmptyStateProps {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  message,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 p-8 text-center text-gray-500">
      <p>{message}</p>
      {actionLabel && onAction && (
        <button onClick={onAction} className="border rounded px-4 py-2 text-sm">
          {actionLabel}
        </button>
      )}
    </div>
  );
}
