import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import type { DocumentData, QueryDocumentSnapshot } from "firebase/firestore";
import { ProductsProvider } from "./ProductsContext";
import { useProducts } from "../hooks/useProducts";
import type { Product } from "../types/product";

// ProductsContext depende de productsService (Firestore) -- se mockea el
// servicio completo, no las queries de Firestore en sí, porque acá lo que
// se testea es la orquestación de estado (debounce de búsqueda, cursor de
// paginación, showLanding), no las queries en sí mismas.
// Consigna: "Sumar tests de ProductsContext/useProducts -- el debounce y
// la paginación no tenían cobertura".

vi.mock("../services/productsService", () => ({
  listProducts: vi.fn(),
}));

import { listProducts } from "../services/productsService";

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: "p_1",
    name: "Pin Geek",
    nameLower: "pin geek",
    categoryId: "pines",
    price: 15000,
    stock: 10,
    description: "Producto de prueba.",
    imageUrl: "https://example.com/pin.png",
    createdAt: 1700000000000,
    ...overrides,
  };
}

const wrapper = ({ children }: { children: ReactNode }) => (
  <ProductsProvider>{children}</ProductsProvider>
);

describe("ProductsContext / useProducts", () => {
  beforeEach(() => {
    vi.mocked(listProducts).mockReset();
  });

  it("carga la primera página al montar, sin filtro ni búsqueda", async () => {
    const products = [makeProduct()];
    vi.mocked(listProducts).mockResolvedValue({ products, nextCursor: null });

    const { result } = renderHook(() => useProducts(), { wrapper });

    await waitFor(() => expect(result.current.status).toBe("idle"));
    expect(result.current.products).toEqual(products);
    expect(listProducts).toHaveBeenCalledWith({
      categoryId: null,
      searchTerm: "",
    });
  });

  it("debounce: varias teclas rápidas en el buscador disparan UNA sola carga, con el último valor", async () => {
    vi.useFakeTimers();
    vi.mocked(listProducts).mockResolvedValue({ products: [], nextCursor: null });

    const { result } = renderHook(() => useProducts(), { wrapper });

    // Deja resolver la carga inicial (categoryId=null, searchTerm="").
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    vi.mocked(listProducts).mockClear();

    act(() => result.current.setSearchInput("po"));
    act(() => vi.advanceTimersByTime(150));
    act(() => result.current.setSearchInput("poke"));
    act(() => vi.advanceTimersByTime(150));
    act(() => result.current.setSearchInput("pokemon"));

    // Todavía no pasaron los 400ms completos desde la ÚLTIMA tecla.
    act(() => vi.advanceTimersByTime(399));
    expect(listProducts).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(1);
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(listProducts).toHaveBeenCalledTimes(1);
    expect(listProducts).toHaveBeenCalledWith({
      categoryId: null,
      searchTerm: "pokemon",
    });

    vi.useRealTimers();
  });

  it("cambiar categoryId dispara una nueva carga de inmediato (sin esperar el debounce)", async () => {
    vi.mocked(listProducts).mockResolvedValue({ products: [], nextCursor: null });
    const { result } = renderHook(() => useProducts(), { wrapper });
    await waitFor(() => expect(result.current.status).toBe("idle"));
    vi.mocked(listProducts).mockClear();

    act(() => result.current.setCategoryId("llaveros"));

    await waitFor(() =>
      expect(listProducts).toHaveBeenCalledWith({
        categoryId: "llaveros",
        searchTerm: "",
      }),
    );
  });

  it("loadMore agrega la siguiente página y hasMore pasa a false cuando ya no hay cursor", async () => {
    const page1 = [makeProduct({ id: "p_1" })];
    const page2 = [makeProduct({ id: "p_2", name: "Taza Pixel" })];
    const cursorStub = {} as QueryDocumentSnapshot<DocumentData>;

    vi.mocked(listProducts)
      .mockResolvedValueOnce({ products: page1, nextCursor: cursorStub })
      .mockResolvedValueOnce({ products: page2, nextCursor: null });

    const { result } = renderHook(() => useProducts(), { wrapper });

    await waitFor(() => expect(result.current.status).toBe("idle"));
    expect(result.current.hasMore).toBe(true);

    await act(async () => {
      await result.current.loadMore();
    });

    expect(result.current.products).toEqual([...page1, ...page2]);
    expect(result.current.hasMore).toBe(false);
    expect(listProducts).toHaveBeenLastCalledWith({
      categoryId: null,
      searchTerm: "",
      cursor: cursorStub,
    });
  });

  it("si listProducts falla, el status pasa a 'error' con un mensaje", async () => {
    vi.mocked(listProducts).mockRejectedValue(new Error("network down"));

    const { result } = renderHook(() => useProducts(), { wrapper });

    await waitFor(() => expect(result.current.status).toBe("error"));
    expect(result.current.error).toMatch(/no pudimos cargar los productos/i);
  });

  it("showLanding: setCategoryId lo apaga y goToLanding lo vuelve a prender limpiando filtro/búsqueda (regresión: bug 'Todas' vs. logo)", async () => {
    vi.mocked(listProducts).mockResolvedValue({ products: [], nextCursor: null });
    const { result } = renderHook(() => useProducts(), { wrapper });
    await waitFor(() => expect(result.current.status).toBe("idle"));

    expect(result.current.showLanding).toBe(true);

    act(() => result.current.setCategoryId("pines"));
    expect(result.current.showLanding).toBe(false);

    act(() => result.current.goToLanding());
    expect(result.current.showLanding).toBe(true);
    expect(result.current.categoryId).toBeNull();
    expect(result.current.searchInput).toBe("");
  });
});
