import type { CartState, CartAction } from "../types/cart";

export const initialCartState: CartState = { items: [] };

export function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD_ITEM": {
      const existing = state.items.find(
        (item) => item.productId === action.payload.productId,
      );
      if (existing) {
        // Tope de stock del lado del cliente: si el caller manda el stock
        // conocido (ProductCard/ProductDetailPage sí lo hacen), no deja
        // subir la cantidad más allá de eso. Sin stock conocido (carrito
        // viejo, o caller que no lo pasa) no hay tope -- Infinity.
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
          // Mismo tope que ADD_ITEM, acá contra el stock que ya traía el
          // item guardado (no viene stock nuevo en este action).
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
