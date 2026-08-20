import type { ProductCategoryId } from "./product";

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  imageUrl: string;
  categoryId: ProductCategoryId;
  stock?: number;
  quantity: number;
}

export interface CartState {
  items: CartItem[];
}

export type CartAction =
  | { type: "ADD_ITEM"; payload: Omit<CartItem, "quantity"> }
  | { type: "REMOVE_ITEM"; payload: { productId: string } }
  | {
      type: "UPDATE_QUANTITY";
      payload: { productId: string; quantity: number };
    }
  | { type: "CLEAR_CART" };
