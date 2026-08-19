import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../test/renderWithProviders";
import { LoginPage } from "./LoginPage";

// Consigna: "Agregar recuperación de contraseña en Login (Firebase ya lo
// soporta con sendPasswordResetEmail)". Firebase no revela si el email
// tiene cuenta o no, así que lo único verificable acá es que el flujo llama
// al servicio con el email correcto y muestra siempre el mismo mensaje --
// nunca una confirmación de que la cuenta existe.

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
  ensureUserProfile: vi.fn(),
  fetchUserProfile: vi.fn(),
  sendPasswordReset: vi.fn(),
}));

import { onAuthStateChanged } from "firebase/auth";
import * as authService from "../services/authService";

describe("LoginPage — recuperación de contraseña", () => {
  beforeEach(() => {
    vi.mocked(onAuthStateChanged).mockReset();
    vi.mocked(onAuthStateChanged).mockImplementation((_auth, callback) => {
      // @ts-expect-error firma simplificada del callback para el mock
      callback(null);
      return () => {};
    });
    vi.mocked(authService.sendPasswordReset).mockReset();
  });

  it("sin email escrito, no llama al servicio y pide completar el campo primero", async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);

    await user.click(
      await screen.findByRole("button", { name: /olvidaste tu contraseña/i }),
    );

    expect(
      await screen.findByText(/escribe tu email arriba/i),
    ).toBeInTheDocument();
    expect(authService.sendPasswordReset).not.toHaveBeenCalled();
  });

  it("con email escrito, llama a sendPasswordReset y muestra el mismo mensaje sin confirmar si la cuenta existe", async () => {
    vi.mocked(authService.sendPasswordReset).mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);

    await user.type(screen.getByLabelText(/email/i), "cliente@geekeame.test");
    await user.click(
      screen.getByRole("button", { name: /olvidaste tu contraseña/i }),
    );

    expect(
      await screen.findByRole("status"),
    ).toHaveTextContent(/si ese email tiene una cuenta/i);
    expect(authService.sendPasswordReset).toHaveBeenCalledWith(
      "cliente@geekeame.test",
    );
  });

  it("edge case: si el servicio falla, muestra error y no el mensaje de éxito", async () => {
    vi.mocked(authService.sendPasswordReset).mockRejectedValue(
      new Error("network error"),
    );
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);

    await user.type(screen.getByLabelText(/email/i), "cliente@geekeame.test");
    await user.click(
      screen.getByRole("button", { name: /olvidaste tu contraseña/i }),
    );

    expect(
      await screen.findByText(/no pudimos enviar el email/i),
    ).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
