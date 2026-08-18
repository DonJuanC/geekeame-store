import { createContext, useContext } from "react";
import type { AuthState } from "../types/auth";

export interface AuthContextValue extends AuthState {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

// El objeto de contexto vive acá (archivo .ts, sin componentes) en vez de
// en AuthContext.tsx: un .tsx que exporta un Context junto a un componente
// rompe react-refresh/only-export-components.
export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
