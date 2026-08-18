import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../test/renderWithProviders";
import { CheckoutPage } from "./CheckoutPage";
import { cartItemFixture, userCustomerFixture } from "../test/fixtures";

// Test de integración: simula el flujo completo "carrito con items ->
// confirmar pedido -> se crea la orden -> se vacía el carrito -> navega a
// /orders". Firebase (auth + createOrder) va mockeado; el resto (Context +
// reducer + componente) corre real, como en producción.
// Consigna: "Tests de integración simulando flujos completos de usuario
// (agregar al carrito, checkout)".

const navigateMock = vi.fn();

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

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
  // onAuthStateChanged llama a ensureUserProfile, no a fetchUserProfile
  // (ver el fix en AuthContext) -- este mock es el que realmente se usa
  // ahora para autenticar en estos tests.
  ensureUserProfile: vi.fn(),
  fetchUserProfile: vi.fn(),
}));

vi.mock("../services/ordersService", () => ({
  createOrder: vi.fn(),
}));

import { onAuthStateChanged } from "firebase/auth";
import * as authService from "../services/authService";
import * as ordersService from "../services/ordersService";

function authenticateAsCustomer() {
  vi.mocked(onAuthStateChanged).mockImplementation((_auth, callback) => {
    // @ts-expect-error firma simplificada del callback para el mock
    callback({ uid: userCustomerFixture.uid });
    return () => {};
  });
  vi.mocked(authService.ensureUserProfile).mockResolvedValue(userCustomerFixture);
}

function seedCart() {
  localStorage.setItem(
    "geekeame-cart",
    JSON.stringify({ items: [cartItemFixture] }),
  );
}

describe("CheckoutPage (integración)", () => {
  beforeEach(() => {
    localStorage.clear();
    navigateMock.mockClear();
    vi.mocked(onAuthStateChanged).mockReset();
  });

  it("confirma el pedido: crea la orden, vacía el carrito y navega a /orders", async () => {
    authenticateAsCustomer();
    seedCart();
    vi.mocked(ordersService.createOrder).mockResolvedValue("order_1");
    const user = userEvent.setup();

    renderWithProviders(<CheckoutPage />);

    const confirmButton = await screen.findByRole("button", {
      name: /confirmar pedido/i,
    });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(ordersService.createOrder).toHaveBeenCalledTimes(1);
    });
    expect(ordersService.createOrder).toHaveBeenCalledWith(
      userCustomerFixture.uid,
      [
        {
          productId: cartItemFixture.productId,
          name: cartItemFixture.name,
          priceAtPurchase: cartItemFixture.price,
          quantity: cartItemFixture.quantity,
        },
      ],
      cartItemFixture.price * cartItemFixture.quantity,
    );
    expect(navigateMock).toHaveBeenCalledWith("/orders?confirmed=order_1");

    await waitFor(() => {
      const stored = JSON.parse(localStorage.getItem("geekeame-cart") ?? "{}");
      expect(stored.items).toHaveLength(0);
    });
  });

  it("edge case doble submit: dos clicks rápidos en confirmar no crean dos órdenes", async () => {
    authenticateAsCustomer();
    seedCart();
    vi.mocked(ordersService.createOrder).mockResolvedValue("order_1");
    const user = userEvent.setup();

    renderWithProviders(<CheckoutPage />);

    const confirmButton = await screen.findByRole("button", {
      name: /confirmar pedido/i,
    });
    await user.click(confirmButton);
    await user.click(confirmButton);

    await waitFor(() => {
      expect(ordersService.createOrder).toHaveBeenCalledTimes(1);
    });
  });

  it("si createOrder falla, muestra el mensaje de error y no navega", async () => {
    authenticateAsCustomer();
    seedCart();
    vi.mocked(ordersService.createOrder).mockRejectedValue(
      new Error("Ya no hay stock suficiente."),
    );
    const user = userEvent.setup();

    renderWithProviders(<CheckoutPage />);

    const confirmButton = await screen.findByRole("button", {
      name: /confirmar pedido/i,
    });
    await user.click(confirmButton);

    expect(
      await screen.findByText(/ya no hay stock suficiente/i),
    ).toBeInTheDocument();
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it("con el carrito vacío no muestra el botón de confirmar", async () => {
    authenticateAsCustomer();

    renderWithProviders(<CheckoutPage />);

    expect(
      await screen.findByText(/tu carrito está vacío/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /confirmar pedido/i }),
    ).not.toBeInTheDocument();
  });
});
