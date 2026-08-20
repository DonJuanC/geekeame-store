import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useTheme } from "../../hooks/useTheme";
import { LoadingState } from "../states/LoadingState";

export function RequireAuth({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const { theme } = useTheme();
  const location = useLocation();
  if (status === "loading")
    return (
      <LoadingState label="Cargando sesión..." dark={theme === "dark"} />
    );
  if (status !== "authenticated")
    return <Navigate to="/login" state={{ from: location }} replace />;
  return <>{children}</>;
}
