import { createContext, useEffect, useState, type ReactNode } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../services/firebase";
import {
  signIn as signInService,
  signUp as signUpService,
  signInWithGoogle as signInWithGoogleService,
  signOut as signOutService,
  fetchUserProfile,
} from "../services/authService";
import type { AuthState } from "../types/auth";

export interface AuthContextValue extends AuthState {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    status: "loading",
    user: null,
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setState({ status: "unauthenticated", user: null });
        return;
      }
      const profile = await fetchUserProfile(firebaseUser.uid);
      setState({
        status: profile ? "authenticated" : "unauthenticated",
        user: profile,
      });
    });
    return unsubscribe;
  }, []);

  async function signIn(email: string, password: string) {
    setState({
      status: "authenticated",
      user: await signInService(email, password),
    });
  }

  async function signUp(email: string, password: string) {
    setState({
      status: "authenticated",
      user: await signUpService(email, password),
    });
  }

  async function signOut() {
    await signOutService();
    setState({ status: "unauthenticated", user: null });
  }

  async function signInWithGoogle() {
    setState({
      status: "authenticated",
      user: await signInWithGoogleService(),
    });
  }

  return (
    <AuthContext.Provider
      value={{ ...state, signIn, signUp, signInWithGoogle, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}
