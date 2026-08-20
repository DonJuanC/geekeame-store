interface LoadingStateProps {
  label?: string;
  dark?: boolean;
}

export function LoadingState({ label = "Cargando...", dark = false }: LoadingStateProps) {
  return (
    <div
      className={`flex items-center justify-center p-8 ${
        dark ? "text-[#9ca3af]" : "text-gray-500"
      }`}
      role="status"
    >
      {label}
    </div>
  );
}
