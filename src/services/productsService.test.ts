import { beforeEach, describe, expect, it, vi } from "vitest";

// Tests de CRUD del panel admin, a nivel de servicio (no de componente):
// createProduct/updateProduct/deleteProduct son la lógica real que ejecuta
// el panel admin al guardar/editar/borrar un producto. Se mockea
// "firebase/firestore" y "./firebase" para no depender de una base real --
// lo que se verifica acá es que productsService arma el documento y llama
// al SDK correctamente, no el comportamiento del SDK en sí.
// Consigna: "Sumar... al menos un test de CRUD del panel admin".

vi.mock("firebase/firestore", () => ({
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  doc: vi.fn(),
  collection: vi.fn(),
  getDocs: vi.fn(),
  getDoc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  startAfter: vi.fn(),
}));

vi.mock("./firebase", () => ({ db: {} }));

import { addDoc, deleteDoc, doc, collection, updateDoc } from "firebase/firestore";
import {
  buildSearchKeywords,
  createProduct,
  deleteProduct,
  updateProduct,
} from "./productsService";

describe("buildSearchKeywords", () => {
  it("genera prefijos en minúscula de cada palabra del nombre", () => {
    const keywords = buildSearchKeywords("Llavero Alien");
    expect(keywords).toEqual(
      expect.arrayContaining(["l", "ll", "lla", "llavero", "a", "al", "ali", "alien"]),
    );
  });

  it("quita tildes para que 'pokemon' matchee 'Pokémon'", () => {
    const keywords = buildSearchKeywords("Taza Pokémon");
    expect(keywords).toContain("pokemon");
  });
});

describe("productsService (CRUD admin)", () => {
  beforeEach(() => {
    vi.mocked(addDoc).mockReset();
    vi.mocked(updateDoc).mockReset();
    vi.mocked(deleteDoc).mockReset();
    vi.mocked(doc).mockReset();
    vi.mocked(collection).mockReset();
  });

  it("createProduct agrega nameLower, searchKeywords y createdAt antes de guardar", async () => {
    vi.mocked(collection).mockReturnValue("products-collection" as never);
    vi.mocked(addDoc).mockResolvedValue({ id: "p_new" } as never);

    const id = await createProduct({
      name: "Llavero Alien",
      categoryId: "llaveros",
      price: 12000,
      stock: 5,
      description: "desc",
      imageUrl: "https://example.com/x.png",
    });

    expect(id).toBe("p_new");
    expect(addDoc).toHaveBeenCalledWith(
      "products-collection",
      expect.objectContaining({
        name: "Llavero Alien",
        nameLower: "llavero alien",
        searchKeywords: expect.arrayContaining(["a", "al", "alien", "llavero"]),
        createdAt: expect.any(Number),
      }),
    );
  });

  it("updateProduct NO toca searchKeywords/nameLower si el patch no cambia el name", async () => {
    vi.mocked(doc).mockReturnValue("product-ref" as never);
    vi.mocked(updateDoc).mockResolvedValue(undefined as never);

    await updateProduct("p_1", { stock: 3 });

    expect(updateDoc).toHaveBeenCalledTimes(1);
    const patchArg = vi.mocked(updateDoc).mock.calls[0][1] as Record<
      string,
      unknown
    >;
    expect(patchArg).toMatchObject({ stock: 3, updatedAt: expect.any(Number) });
    expect(patchArg).not.toHaveProperty("searchKeywords");
    expect(patchArg).not.toHaveProperty("nameLower");
  });

  it("updateProduct recalcula nameLower/searchKeywords cuando el patch incluye un name nuevo", async () => {
    vi.mocked(doc).mockReturnValue("product-ref" as never);
    vi.mocked(updateDoc).mockResolvedValue(undefined as never);

    await updateProduct("p_1", { name: "Taza Pixel" });

    expect(updateDoc).toHaveBeenCalledWith(
      "product-ref",
      expect.objectContaining({
        name: "Taza Pixel",
        nameLower: "taza pixel",
        searchKeywords: expect.arrayContaining(["t", "ta", "taz", "taza"]),
      }),
    );
  });

  it("deleteProduct borra el documento correcto (edge case: no valida existencia antes, delega en Firestore)", async () => {
    vi.mocked(doc).mockReturnValue("product-ref" as never);
    vi.mocked(deleteDoc).mockResolvedValue(undefined as never);

    await deleteProduct("p_1");

    expect(deleteDoc).toHaveBeenCalledWith("product-ref");
  });
});
