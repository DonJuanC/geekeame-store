import { describe, expect, it } from "vitest";
import { pickFeaturedProducts } from "./HomePage";
import type { Product } from "../types/product";

// "Destacados" mostraba los primeros N productos por fecha sin importar la
// categoría -- si varios seguidos eran de la misma categoría (típico tras
// un seed por lotes), la vitrina quedaba repetida. pickFeaturedProducts
// prioriza variedad: como mucho un producto por categoría en la primera
// pasada, y solo completa con repetidos si sobran cupos.

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: "p_1",
    name: "Producto",
    nameLower: "producto",
    categoryId: "pines",
    price: 10000,
    stock: 5,
    description: "desc",
    imageUrl: "https://example.com/p.png",
    createdAt: 1700000000000,
    ...overrides,
  };
}

describe("pickFeaturedProducts", () => {
  it("con productos de categorías distintas, elige el más reciente de cada una", () => {
    const products = [
      makeProduct({ id: "p_1", categoryId: "pines", createdAt: 5 }),
      makeProduct({ id: "p_2", categoryId: "tazas", createdAt: 4 }),
      makeProduct({ id: "p_3", categoryId: "stickers", createdAt: 3 }),
    ];

    const featured = pickFeaturedProducts(products, 6);

    expect(featured.map((p) => p.id)).toEqual(["p_1", "p_2", "p_3"]);
  });

  it("edge case: varios productos seguidos de la misma categoría no monopolizan Destacados", () => {
    const products = [
      makeProduct({ id: "p_1", categoryId: "pines", createdAt: 6 }),
      makeProduct({ id: "p_2", categoryId: "pines", createdAt: 5 }),
      makeProduct({ id: "p_3", categoryId: "pines", createdAt: 4 }),
      makeProduct({ id: "p_4", categoryId: "tazas", createdAt: 3 }),
      makeProduct({ id: "p_5", categoryId: "stickers", createdAt: 2 }),
    ];

    const featured = pickFeaturedProducts(products, 3);

    // Un solo "pines" (el más reciente), no los tres primeros del array.
    expect(featured.map((p) => p.id)).toEqual(["p_1", "p_4", "p_5"]);
  });

  it("si hay menos categorías que cupos, completa con los siguientes productos más recientes sin repetir productos", () => {
    const products = [
      makeProduct({ id: "p_1", categoryId: "pines", createdAt: 5 }),
      makeProduct({ id: "p_2", categoryId: "tazas", createdAt: 4 }),
      makeProduct({ id: "p_3", categoryId: "pines", createdAt: 3 }),
      makeProduct({ id: "p_4", categoryId: "tazas", createdAt: 2 }),
    ];

    const featured = pickFeaturedProducts(products, 4);

    expect(featured).toHaveLength(4);
    expect(new Set(featured.map((p) => p.id)).size).toBe(4);
    expect(featured.map((p) => p.id)).toEqual(["p_1", "p_2", "p_3", "p_4"]);
  });

  it("edge case: menos productos que cupos, devuelve todos sin romper", () => {
    const products = [makeProduct({ id: "p_1" })];

    expect(pickFeaturedProducts(products, 6)).toEqual(products);
  });

  it("edge case: sin productos, devuelve un array vacío", () => {
    expect(pickFeaturedProducts([], 6)).toEqual([]);
  });
});
