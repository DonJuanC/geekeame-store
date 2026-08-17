import {
  createContext,
  useEffect,
  useReducer,
  type Dispatch,
  type ReactNode,
} from "react";
import { cartReducer, initialCartState } from "./cartReducer";
import type { CartState, CartAction } from "../types/cart";

const STORAGE_KEY = "geekeame-cart";

function loadInitialState(): CartState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CartState) : initialCartState;
  } catch {
    return initialCartState;
  }
}

interface CartContextValue {
  items: CartState["items"];
  total: number;
  dispatch: Dispatch<CartAction>;
}

export const CartContext = createContext<CartContextValue | undefined>(
  undefined,
);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(
    cartReducer,
    undefined,
    loadInitialState,
  );

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const total = state.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  return (
    <CartContext.Provider value={{ items: state.items, total, dispatch }}>
      {children}
    </CartContext.Provider>
  );
}
