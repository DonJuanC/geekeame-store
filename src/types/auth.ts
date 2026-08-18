export type UserRole = "customer" | "admin";

export interface UserProfile {
  uid: string;
  email: string;
  role: UserRole;
  createdAt: number;
}

export type AuthStatus =
  | "idle"
  | "loading"
  | "authenticated"
  | "unauthenticated";

export interface AuthState {
  status: AuthStatus;
  user: UserProfile | null;
}
