import { describe, expect, it } from "vitest";
import { cartReducer, initialCartState } from "./cartReducer";
import { productFixture } from "../test/fixtures";

// cartReducer es una función pura (mismo input -> mismo output, sin red ni
// side effects), así que no necesita mocks: es el test más rápido y
// confiable de toda la suite, y la primera línea de defensa contra bugs
// de totales/cantidades en el carrito (consigna: "Testear cartReducer
// verificando que cada action produce el estado correcto").

const newItemPayload = {
  productId: productFixture.id,
  name: productFixture.name,
  price: productFixture.price,
  imageUrl: productFixture.imageUrl,
};

describe("cartReducer", () => {
  it("ADD_ITEM agrega un producto nuevo con quantity 1", () => {
    const next = cartReducer(initialCartState, {
      type: "ADD_ITEM",
      payload: newItemPayload,
    });

    expect(next.items).toHaveLength(1);
    expect(next.items[0]).toEqual({ ...newItemPayload, quantity: 1 });
  });

  it("ADD_ITEM sobre un producto existente incrementa quantity en 1 (no lo duplica)", () => {
    const withItem = cartReducer(initialCartState, {
      type: "ADD_ITEM",
      payload: newItemPayload,
    });

    const next = cartReducer(withItem, {
      type: "ADD_ITEM",
      payload: newItemPayload,
    });

    expect(next.items).toHaveLength(1);
    expect(next.items[0].quantity).toBe(2);
  });

  it("REMOVE_ITEM elimina el producto indicado", () => {
    const withItem = cartReducer(initialCartState, {
      type: "ADD_ITEM",
      payload: newItemPayload,
    });

    const next = cartReducer(withItem, {
      type: "REMOVE_ITEM",
      payload: { productId: productFixture.id },
    });

    expect(next.items).toHaveLength(0);
  });

  it("REMOVE_ITEM sobre un producto inexistente no altera el estado (edge case)", () => {
    const withItem = cartReducer(initialCartState, {
      type: "ADD_ITEM",
      payload: newItemPayload,
    });

    const next = cartReducer(withItem, {
      type: "REMOVE_ITEM",
      payload: { productId: "no-existe-en-el-carrito" },
    });

    expect(next.items).toHaveLength(1);
    expect(next.items[0].productId).toBe(productFixture.id);
  });

  it("UPDATE_QUANTITY actualiza la cantidad del producto", () => {
    const withItem = cartReducer(initialCartState, {
      type: "ADD_ITEM",
      payload: newItemPayload,
    });

    const next = cartReducer(withItem, {
      type: "UPDATE_QUANTITY",
      payload: { productId: productFixture.id, quantity: 5 },
    });

    expect(next.items[0].quantity).toBe(5);
  });

  it("UPDATE_QUANTITY a 0 elimina el producto (edge case clásico)", () => {
    const withItem = cartReducer(initialCartState, {
      type: "ADD_ITEM",
      payload: newItemPayload,
    });

    const next = cartReducer(withItem, {
      type: "UPDATE_QUANTITY",
      payload: { productId: productFixture.id, quantity: 0 },
    });

    expect(next.items).toHaveLength(0);
  });

  it("UPDATE_QUANTITY con valor negativo se trata como 0 (edge case, Math.max clamp)", () => {
    const withItem = cartReducer(initialCartState, {
      type: "ADD_ITEM",
      payload: newItemPayload,
    });

    const next = cartReducer(withItem, {
      type: "UPDATE_QUANTITY",
      payload: { productId: productFixture.id, quantity: -3 },
    });

    expect(next.items).toHaveLength(0);
  });

  it("ADD_ITEM no supera el stock disponible (edge case, Grupo 2: deshabilitar al superar stock)", () => {
    const withItem = cartReducer(initialCartState, {
      type: "ADD_ITEM",
      payload: { ...newItemPayload, stock: 2 },
    });

    const atLimit = cartReducer(withItem, {
      type: "ADD_ITEM",
      payload: { ...newItemPayload, stock: 2 },
    });
    expect(atLimit.items[0].quantity).toBe(2);

    // Un tercer ADD_ITEM no debería subir más allá del stock conocido.
    const stillAtLimit = cartReducer(atLimit, {
      type: "ADD_ITEM",
      payload: { ...newItemPayload, stock: 2 },
    });
    expect(stillAtLimit.items[0].quantity).toBe(2);
  });

  it("UPDATE_QUANTITY no supera el stock guardado en el item (edge case)", () => {
    const withItem = cartReducer(initialCartState, {
      type: "ADD_ITEM",
      payload: { ...newItemPayload, stock: 3 },
    });

    const next = cartReducer(withItem, {
      type: "UPDATE_QUANTITY",
      payload: { productId: productFixture.id, quantity: 10 },
    });

    expect(next.items[0].quantity).toBe(3);
  });

  it("CLEAR_CART vacía el carrito por completo", () => {
    const withItem = cartReducer(initialCartState, {
      type: "ADD_ITEM",
      payload: newItemPayload,
    });

    const next = cartReducer(withItem, { type: "CLEAR_CART" });

    expect(next.items).toHaveLength(0);
  });

  it("una acción desconocida devuelve el mismo estado sin modificarlo", () => {
    // @ts-expect-error acción inválida a propósito, para cubrir el `default` del switch
    const next = cartReducer(initialCartState, { type: "NOOP" });
    expect(next).toBe(initialCartState);
  });
});
