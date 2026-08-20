import { useEffect, useState, type ReactNode } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../services/firebase";
import {
  signIn as signInService,
  signUp as signUpService,
  signInWithGoogle as signInWithGoogleService,
  signOut as signOutService,
  sendPasswordReset as sendPasswordResetService,
  ensureUserProfile,
} from "../services/authService";
import type { AuthState } from "../types/auth";
import { AuthContext } from "../hooks/useAuth";

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
      const profile = await ensureUserProfile(
        firebaseUser.uid,
        firebaseUser.email ?? "",
      );
      setState({ status: "authenticated", user: profile });
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

  async function resetPassword(email: string) {
    await sendPasswordResetService(email);
  }

  return (
    <AuthContext.Provider
      value={{
        ...state,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
