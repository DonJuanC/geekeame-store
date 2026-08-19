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

import {
  addDoc,
  deleteDoc,
  doc,
  collection,
  updateDoc,
  getDocs,
  query,
  where,
  limit,
  orderBy,
} from "firebase/firestore";
import {
  buildSearchKeywords,
  createProduct,
  deleteProduct,
  listFeaturedCandidates,
  updateProduct,
} from "./productsService";
import { PRODUCT_CATEGORIES } from "../constants/categories";

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

describe("listFeaturedCandidates", () => {
  // Bug real: Destacados salía de un slice de "los más recientes" SIN
  // filtro de categoría, así que si esa página no traía ninguna categoría
  // faltante, esa categoría directamente no aparecía. Este test verifica
  // la parte de la que depende el fix -- que se consulta cada categoría
  // por separado, no una sola query general -- independiente de
  // interleaveByCategory (que ya tiene su propia cobertura en
  // HomePage.test.ts).
  beforeEach(() => {
    vi.mocked(collection).mockReset();
    vi.mocked(query).mockReset();
    vi.mocked(where).mockReset();
    vi.mocked(limit).mockReset();
    vi.mocked(orderBy).mockReset();
    vi.mocked(getDocs).mockReset();
  });

  it("consulta cada categoría por separado y devuelve un grupo por categoría en el mismo orden que PRODUCT_CATEGORIES", async () => {
    vi.mocked(collection).mockReturnValue("products-collection" as never);
    vi.mocked(orderBy).mockReturnValue({ type: "orderBy" } as never);
    vi.mocked(limit).mockReturnValue({ type: "limit" } as never);
    vi.mocked(where).mockImplementation(
      (field, _op, value) => ({ type: "where", field, value }) as never,
    );
    vi.mocked(query).mockImplementation(
      (_ref, ...constraints) => constraints as never,
    );
    vi.mocked(getDocs).mockImplementation(async (q) => {
      const constraints = q as Array<{ type?: string; field?: string; value?: unknown }>;
      const categoryClause = constraints.find(
        (c) => c?.type === "where" && c.field === "categoryId",
      );
      const categoryId = categoryClause?.value as string;
      return {
        docs: [
          {
            id: `${categoryId}_1`,
            data: () => ({ categoryId, name: `Producto de ${categoryId}` }),
          },
        ],
      } as never;
    });

    const groups = await listFeaturedCandidates(2);

    expect(groups).toHaveLength(PRODUCT_CATEGORIES.length);
    groups.forEach((group, i) => {
      expect(group).toHaveLength(1);
      expect(group[0].categoryId).toBe(PRODUCT_CATEGORIES[i].id);
    });
  });

  it("edge case: una categoría sin productos devuelve un grupo vacío, no rompe las demás", async () => {
    vi.mocked(collection).mockReturnValue("products-collection" as never);
    vi.mocked(orderBy).mockReturnValue({ type: "orderBy" } as never);
    vi.mocked(limit).mockReturnValue({ type: "limit" } as never);
    vi.mocked(where).mockImplementation(
      (field, _op, value) => ({ type: "where", field, value }) as never,
    );
    vi.mocked(query).mockImplementation(
      (_ref, ...constraints) => constraints as never,
    );
    vi.mocked(getDocs).mockResolvedValue({ docs: [] } as never);

    const groups = await listFeaturedCandidates(2);

    expect(groups).toHaveLength(PRODUCT_CATEGORIES.length);
    groups.forEach((group) => expect(group).toEqual([]));
  });
});
