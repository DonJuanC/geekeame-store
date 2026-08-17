import type { CartState, CartAction } from "../types/cart";

export const initialCartState: CartState = { items: [] };

export function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD_ITEM": {
      const existing = state.items.find(
        (item) => item.productId === action.payload.productId,
      );
      if (existing) {
        return {
          items: state.items.map((item) =>
            item.productId === action.payload.productId
              ? { ...item, quantity: item.quantity + 1 }
              : item,
          ),
        };
      }
      return { items: [...state.items, { ...action.payload, quantity: 1 }] };
    }
    case "REMOVE_ITEM":
      return {
        items: state.items.filter(
          (item) => item.productId !== action.payload.productId,
        ),
      };
    case "UPDATE_QUANTITY": {
      const quantity = Math.max(0, action.payload.quantity);
      if (quantity === 0) {
        return {
          items: state.items.filter(
            (item) => item.productId !== action.payload.productId,
          ),
        };
      }
      return {
        items: state.items.map((item) =>
          item.productId === action.payload.productId
            ? { ...item, quantity }
            : item,
        ),
      };
    }
    case "CLEAR_CART":
      return { items: [] };
    default:
      return state;
  }
}
