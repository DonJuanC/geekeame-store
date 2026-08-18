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
  signInWithGoogle: vi.fn(),
  signOut: vi.fn(),
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

  it("pasa a 'authenticated' con el perfil cuando Firebase reporta un usuario con perfil en Firestore", async () => {
    vi.mocked(onAuthStateChanged).mockImplementation((_auth, callback) => {
      // @ts-expect-error firma simplificada del callback para el mock
      callback({ uid: userCustomerFixture.uid });
      return () => {};
    });
    vi.mocked(authService.fetchUserProfile).mockResolvedValue(userCustomerFixture);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.status).toBe("authenticated"));
    expect(result.current.user).toEqual(userCustomerFixture);
  });

  it("edge case: usuario autenticado en Firebase pero sin perfil en Firestore queda 'unauthenticated'", async () => {
    vi.mocked(onAuthStateChanged).mockImplementation((_auth, callback) => {
      // @ts-expect-error firma simplificada del callback para el mock
      callback({ uid: userCustomerFixture.uid });
      return () => {};
    });
    vi.mocked(authService.fetchUserProfile).mockResolvedValue(null);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.status).toBe("unauthenticated"));
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
    vi.mocked(authService.fetchUserProfile).mockResolvedValue(userCustomerFixture);
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
