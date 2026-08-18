import { createContext, useContext, type Dispatch } from "react";
import type { CartState, CartAction, CartItem } from "../types/cart";

export interface CartContextValue {
  items: CartState["items"];
  total: number;
  dispatch: Dispatch<CartAction>;
}

// Igual que AuthContext: el Context vive en el .ts del hook, no en el .tsx
// del provider, para no violar react-refresh/only-export-components.
export const CartContext = createContext<CartContextValue | undefined>(
  undefined,
);

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart debe usarse dentro de <CartProvider>");

  const { dispatch, items, total } = ctx;

  function addItem(item: Omit<CartItem, "quantity">) {
    dispatch({ type: "ADD_ITEM", payload: item });
  }
  function removeItem(productId: string) {
    dispatch({ type: "REMOVE_ITEM", payload: { productId } });
  }
  function updateQuantity(productId: string, quantity: number) {
    dispatch({ type: "UPDATE_QUANTITY", payload: { productId, quantity } });
  }
  function clearCart() {
    dispatch({ type: "CLEAR_CART" });
  }

  return {
    items,
    total,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
  };
}
