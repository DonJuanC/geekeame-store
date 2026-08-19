import { describe, expect, it } from "vitest";
import type { Product } from "../types/product";
import { interleaveByCategory } from "./interleaveByCategory";

// Bug real en producción: Destacados se armaba con un slice de los
// productos más recientes SIN filtro de categoría -- si esa página no
// incluía pines/stickers/posters (porque las últimas cargas del catálogo
// fueron todas llaveros/tazas), la vitrina terminaba siendo 5 tazas y 1
// llavero. El fix trae lo más reciente de CADA categoría por separado
// (listFeaturedCandidates) y interleaveByCategory decide cómo combinarlas:
// alternando entre categorías ronda por ronda, no agotando una antes de
// pasar a la siguiente.

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

describe("interleaveByCategory", () => {
  it("con un producto por categoría, los toma todos en el orden de los grupos", () => {
    const groups = [
      [makeProduct({ id: "p_pin", categoryId: "pines" })],
      [makeProduct({ id: "p_taza", categoryId: "tazas" })],
      [makeProduct({ id: "p_sticker", categoryId: "stickers" })],
    ];

    expect(interleaveByCategory(groups, 6).map((p) => p.id)).toEqual([
      "p_pin",
      "p_taza",
      "p_sticker",
    ]);
  });

  it("bug real: con menos cupos que candidatos totales, una categoría con muchos más candidatos NO monopoliza el resultado", () => {
    const groups = [
      [makeProduct({ id: "llavero_1", categoryId: "llaveros" })],
      [
        makeProduct({ id: "taza_1", categoryId: "tazas" }),
        makeProduct({ id: "taza_2", categoryId: "tazas" }),
        makeProduct({ id: "taza_3", categoryId: "tazas" }),
        makeProduct({ id: "taza_4", categoryId: "tazas" }),
        makeProduct({ id: "taza_5", categoryId: "tazas" }),
      ],
    ];

    // Solo 3 cupos para 6 candidatos totales: un slice ingenuo de "lo más
    // reciente en general" (el bug real) hubiera dado 3 tazas seguidas si
    // las tazas vinieran primero en el orden de recencia. Acá se garantiza
    // que el llavero entra igual, en vez de quedar afuera por completo.
    const featured = interleaveByCategory(groups, 3);

    expect(featured.map((p) => p.id)).toEqual(["llavero_1", "taza_1", "taza_2"]);
    expect(featured.some((p) => p.categoryId === "llaveros")).toBe(true);
  });

  it("respeta el orden de recencia dentro de cada categoría (grupo ya viene ordenado por createdAt desc)", () => {
    const groups = [
      [
        makeProduct({ id: "pin_reciente", categoryId: "pines" }),
        makeProduct({ id: "pin_viejo", categoryId: "pines" }),
      ],
      [makeProduct({ id: "taza_1", categoryId: "tazas" })],
    ];

    const featured = interleaveByCategory(groups, 3);

    // Ronda 0: pin_reciente, taza_1. Ronda 1: pin_viejo (tazas ya no tiene más).
    expect(featured.map((p) => p.id)).toEqual([
      "pin_reciente",
      "taza_1",
      "pin_viejo",
    ]);
  });

  it("edge case: categorías vacías (sin productos) no rompen nada", () => {
    const groups: Product[][] = [[], [makeProduct({ id: "p_1" })], []];

    expect(interleaveByCategory(groups, 6).map((p) => p.id)).toEqual(["p_1"]);
  });

  it("edge case: sin candidatos en ninguna categoría, devuelve un array vacío", () => {
    expect(interleaveByCategory([[], []], 6)).toEqual([]);
  });

  it("edge case: menos candidatos en total que el cupo pedido, devuelve todos sin romper", () => {
    const groups = [[makeProduct({ id: "p_1" })]];

    expect(interleaveByCategory(groups, 6).map((p) => p.id)).toEqual(["p_1"]);
  });
});
