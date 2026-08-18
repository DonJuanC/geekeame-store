import type { ProductCategoryId } from "./product";

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  imageUrl: string;
  // Se agrega para que CartPage pueda mostrar el mismo placeholder
  // emoji+color que el resto del sitio (ver ProductImage/
  // productPlaceholder.ts) en vez de la <img> cruda de placehold.co --
  // antes no se guardaba porque nada del carrito la necesitaba.
  categoryId: ProductCategoryId;
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
