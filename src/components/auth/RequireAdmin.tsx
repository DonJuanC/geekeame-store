import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useTheme } from "../../hooks/useTheme";
import { LoadingState } from "../states/LoadingState";

export function RequireAdmin({ children }: { children: ReactNode }) {
  const { status, user } = useAuth();
  const { theme } = useTheme();
  if (status === "loading")
    return (
      <LoadingState label="Cargando sesión..." dark={theme === "dark"} />
    );
  if (status !== "authenticated") return <Navigate to="/login" replace />;
  if (user?.role !== "admin") return <Navigate to="/" replace />;
  return <>{children}</>;
}
