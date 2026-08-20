import type { CartState, CartAction } from "../types/cart";

export const initialCartState: CartState = { items: [] };

export function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD_ITEM": {
      const existing = state.items.find(
        (item) => item.productId === action.payload.productId,
      );
      if (existing) {
        const max = action.payload.stock ?? existing.stock ?? Infinity;
        return {
          items: state.items.map((item) =>
            item.productId === action.payload.productId
              ? {
                  ...item,
                  ...action.payload,
                  quantity: Math.min(item.quantity + 1, max),
                }
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
      return {
        items: state.items.flatMap((item) => {
          if (item.productId !== action.payload.productId) return [item];
          const max = item.stock ?? Infinity;
          const quantity = Math.max(0, Math.min(action.payload.quantity, max));
          return quantity === 0 ? [] : [{ ...item, quantity }];
        }),
      };
    }
    case "CLEAR_CART":
      return { items: [] };
    default:
      return state;
  }
}
