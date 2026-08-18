import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { AuthProvider } from "../contexts/AuthContext";
import { useAuth } from "./useAuth";
import { userCustomerFixture } from "../test/fixtures";

// useAuth depende de AuthContext, que a su vez llama directo a
// onAuthStateChanged de "firebase/auth" y a "../services/authService".
// Se mockean ambos módulos (vi.mock) para que el test no dependa de la red
// ni de credenciales reales, y se controla el "usuario" de Firebase
// invocando manualmente el callback que el mock recibe.
// Consigna: "Testear custom hooks (useCart, useAuth) con renderHook de
// forma aislada" + "Mockear Firebase... para que tests no dependan de
// servicios externos".

vi.mock("firebase/auth", () => ({
  onAuthStateChanged: vi.fn(),
}));

vi.mock("../services/firebase", () => ({
  auth: {},
  db: {},
}));

vi.mock("../services/authService", () => ({
  signIn: vi.fn(),
  signUp: vi.fn(),
  // signInWithGoogle ahora usa signInWithPopup (ver authService) y
  // devuelve el UserProfile directo -- ya no depende de un
  // completeGoogleRedirect al montar, así que no hace falta mockear eso
  // acá.
  signInWithGoogle: vi.fn(),
  signOut: vi.fn(),
  // onAuthStateChanged llama a ensureUserProfile (crea el perfil si no
  // existe) en vez de a fetchUserProfile (solo lectura) -- ver el fix en
  // AuthContext: depender de un fetch de solo lectura dejaba a cualquier
  // usuario autenticado en Firebase pero sin doc en Firestore varado en
  // "unauthenticated" para siempre.
  ensureUserProfile: vi.fn(),
  fetchUserProfile: vi.fn(),
}));

import { onAuthStateChanged } from "firebase/auth";
import * as authService from "../services/authService";

const wrapper = ({ children }: { children: ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe("useAuth", () => {
  beforeEach(() => {
    vi.mocked(onAuthStateChanged).mockReset();
  });

  it("pasa a 'unauthenticated' cuando Firebase no reporta usuario", async () => {
    vi.mocked(onAuthStateChanged).mockImplementation((_auth, callback) => {
      // @ts-expect-error firma simplificada del callback para el mock
      callback(null);
      return () => {};
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.status).toBe("unauthenticated"));
    expect(result.current.user).toBeNull();
  });

  it("pasa a 'authenticated' con el perfil cuando Firebase reporta un usuario con perfil ya existente en Firestore", async () => {
    vi.mocked(onAuthStateChanged).mockImplementation((_auth, callback) => {
      // @ts-expect-error firma simplificada del callback para el mock
      callback({ uid: userCustomerFixture.uid });
      return () => {};
    });
    vi.mocked(authService.ensureUserProfile).mockResolvedValue(userCustomerFixture);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.status).toBe("authenticated"));
    expect(result.current.user).toEqual(userCustomerFixture);
  });

  it("usuario autenticado en Firebase pero SIN perfil en Firestore: se crea el perfil y queda 'authenticated' (no se queda varado)", async () => {
    // Este es el caso concreto del bug reportado: un login con Google
    // recién vuelto del redirect, donde Firebase ya considera la sesión
    // válida pero todavía no existe el doc en "users". Antes esto se
    // resolvía con un fetchUserProfile de solo lectura -> null -> la app
    // quedaba en "unauthenticated" para siempre por más que
    // onAuthStateChanged siguiera reportando un firebaseUser válido.
    vi.mocked(onAuthStateChanged).mockImplementation((_auth, callback) => {
      // @ts-expect-error firma simplificada del callback para el mock
      callback({ uid: userCustomerFixture.uid });
      return () => {};
    });
    vi.mocked(authService.ensureUserProfile).mockResolvedValue(userCustomerFixture);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.status).toBe("authenticated"));
    expect(authService.ensureUserProfile).toHaveBeenCalledWith(
      userCustomerFixture.uid,
      "",
    );
  });

  it("signIn actualiza el estado a authenticated con el usuario devuelto por el servicio", async () => {
    vi.mocked(onAuthStateChanged).mockImplementation((_auth, callback) => {
      // @ts-expect-error firma simplificada del callback para el mock
      callback(null);
      return () => {};
    });
    vi.mocked(authService.signIn).mockResolvedValue(userCustomerFixture);

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.status).toBe("unauthenticated"));

    await act(async () => {
      await result.current.signIn("cliente@geekeame.test", "secreta123");
    });

    expect(result.current.status).toBe("authenticated");
    expect(result.current.user).toEqual(userCustomerFixture);
  });

  it("signOut limpia el usuario y vuelve a 'unauthenticated'", async () => {
    vi.mocked(onAuthStateChanged).mockImplementation((_auth, callback) => {
      // @ts-expect-error firma simplificada del callback para el mock
      callback({ uid: userCustomerFixture.uid });
      return () => {};
    });
    vi.mocked(authService.ensureUserProfile).mockResolvedValue(userCustomerFixture);
    vi.mocked(authService.signOut).mockResolvedValue(undefined);

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.status).toBe("authenticated"));

    await act(async () => {
      await result.current.signOut();
    });

    expect(result.current.status).toBe("unauthenticated");
    expect(result.current.user).toBeNull();
  });
});
