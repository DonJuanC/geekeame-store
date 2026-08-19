import { describe, expect, it } from "vitest";
import type { Product } from "../types/product";
import { filterAdminProducts } from "./filterAdminProducts";

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

describe("filterAdminProducts", () => {
  const products = [
    makeProduct({ id: "p_pin", name: "Pin Alien", nameLower: "pin alien", categoryId: "pines" }),
    makeProduct({ id: "p_taza", name: "Taza Pokémon", nameLower: "taza pokémon", categoryId: "tazas" }),
    makeProduct({ id: "p_llavero", name: "Llavero Alien", nameLower: "llavero alien", categoryId: "llaveros" }),
  ];

  it("sin categoría ni búsqueda, devuelve todos los productos", () => {
    expect(filterAdminProducts(products, "all", "")).toHaveLength(3);
  });

  it("filtra por categoría exacta", () => {
    const result = filterAdminProducts(products, "pines", "");
    expect(result.map((p) => p.id)).toEqual(["p_pin"]);
  });

  it("busca por substring del nombre, sin importar mayúsculas", () => {
    const result = filterAdminProducts(products, "all", "ALIEN");
    expect(result.map((p) => p.id).sort()).toEqual(["p_llavero", "p_pin"]);
  });

  it("combina categoría y búsqueda a la vez", () => {
    const result = filterAdminProducts(products, "llaveros", "alien");
    expect(result.map((p) => p.id)).toEqual(["p_llavero"]);
  });

  it("edge case: sin match, devuelve un array vacío", () => {
    expect(filterAdminProducts(products, "all", "inexistente")).toEqual([]);
  });
});
