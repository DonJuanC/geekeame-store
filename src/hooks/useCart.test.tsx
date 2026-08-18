import { beforeEach, describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { CartProvider } from "../contexts/CartContext";
import { useCart } from "./useCart";
import { productFixture } from "../test/fixtures";

// useCart no depende de Firebase (solo de CartContext + localStorage), así
// que se testea aislado con renderHook + el CartProvider real, sin mocks.
// Consigna: "Testear custom hooks (useCart, useAuth) con renderHook de
// forma aislada".

const wrapper = ({ children }: { children: ReactNode }) => (
  <CartProvider>{children}</CartProvider>
);

const itemToAdd = {
  productId: productFixture.id,
  name: productFixture.name,
  price: productFixture.price,
  imageUrl: productFixture.imageUrl,
};

describe("useCart", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("arranca vacío cuando no hay carrito guardado en localStorage", () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    expect(result.current.items).toHaveLength(0);
    expect(result.current.total).toBe(0);
  });

  it("addItem agrega un producto y recalcula el total", () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.addItem(itemToAdd);
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.total).toBe(productFixture.price);
  });

  it("addItem del mismo producto acumula quantity en vez de duplicarlo", () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.addItem(itemToAdd);
      result.current.addItem(itemToAdd);
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].quantity).toBe(2);
    expect(result.current.total).toBe(productFixture.price * 2);
  });

  it("updateQuantity a 0 elimina el producto del carrito (edge case)", () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.addItem(itemToAdd);
    });
    act(() => {
      result.current.updateQuantity(productFixture.id, 0);
    });

    expect(result.current.items).toHaveLength(0);
    expect(result.current.total).toBe(0);
  });

  it("removeItem elimina el producto indicado", () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.addItem(itemToAdd);
    });
    act(() => {
      result.current.removeItem(productFixture.id);
    });

    expect(result.current.items).toHaveLength(0);
  });

  it("removeItem sobre un producto inexistente no rompe el estado (edge case)", () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.addItem(itemToAdd);
      result.current.removeItem("producto-que-no-esta-en-el-carrito");
    });

    expect(result.current.items).toHaveLength(1);
  });

  it("clearCart vacía el carrito y resetea el total", () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.addItem(itemToAdd);
    });
    act(() => {
      result.current.clearCart();
    });

    expect(result.current.items).toHaveLength(0);
    expect(result.current.total).toBe(0);
  });

  it("persiste el carrito en localStorage al modificarlo", () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.addItem(itemToAdd);
    });

    const stored = JSON.parse(localStorage.getItem("geekeame-cart") ?? "{}");
    expect(stored.items).toHaveLength(1);
    expect(stored.items[0].productId).toBe(productFixture.id);
  });
});
