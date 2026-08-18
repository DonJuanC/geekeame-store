interface LoadingStateProps {
  label?: string;
  // Opcional y en false por defecto: solo Home pasa dark={theme==="dark"}
  // hoy. El resto de los callers (admin, checkout, etc.) no lo pasan y
  // siguen con el texto gris de siempre sobre fondo claro.
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
