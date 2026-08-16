export function LoadingState({ label = "Cargando..." }: { label?: string }) {
  return (
    <div
      className="flex items-center justify-center p-8 text-gray-500"
      role="status"
    >
      {label}
    </div>
  );
}
