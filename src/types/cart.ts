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
  // Stock del producto al momento de agregarlo/actualizarlo -- opcional
  // (los carritos ya persistidos en localStorage antes de este campo no lo
  // tienen) para que un carrito viejo sin este dato siga funcionando sin
  // límite de cantidad en vez de romper. Se usa solo como tope del lado
  // del cliente (deshabilitar "+" al llegar al stock conocido); la validación
  // real e inviolable sigue siendo la transacción de Firestore en
  // ordersService.createOrder.
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
