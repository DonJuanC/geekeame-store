interface EmptyStateProps {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  dark?: boolean;
}

export function EmptyState({
  message,
  actionLabel,
  onAction,
  dark = false,
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center gap-3 p-8 text-center ${
        dark ? "text-[#9ca3af]" : "text-gray-500"
      }`}
    >
      <p>{message}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className={`border rounded px-4 py-2 text-sm ${
            dark ? "border-[#3f3a5c] text-[#c4b5fd]" : ""
          }`}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
