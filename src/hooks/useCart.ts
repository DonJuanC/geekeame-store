import { useContext } from "react";
import { CartContext } from "../contexts/CartContext";
import type { CartItem } from "../types/cart";

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
