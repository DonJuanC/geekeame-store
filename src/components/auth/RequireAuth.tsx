import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

export function RequireAuth({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const location = useLocation();
  if (status === "loading")
    return <div className="p-8 text-center">Cargando sesión</div>;
  if (status !== "authenticated")
    return <Navigate to="/login" state={{ from: location }} replace />;
  return <>{children}</>;
}
