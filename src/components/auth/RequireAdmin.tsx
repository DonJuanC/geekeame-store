import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

export function RequireAdmin({ children }: { children: ReactNode }) {
  const { status, user } = useAuth();
  if (status === "loading")
    return <div className="p-8 text-center">Cargando sesión</div>;
  if (status !== "authenticated") return <Navigate to="/login" replace />;
  if (user?.role !== "admin") return <Navigate to="/" replace />;
  return <>{children}</>;
}
