import type { Product } from "../types/product";
import type { CartItem } from "../types/cart";
import type { UserProfile } from "../types/auth";

export const productFixture: Product = {
  id: "p_1",
  name: "Pin Geek de prueba",
  nameLower: "pin geek de prueba",
  categoryId: "pines",
  price: 15000,
  stock: 10,
  description: "Producto de prueba para la suite de tests.",
  imageUrl: "https://example.com/pin.png",
  createdAt: 1700000000000,
};

export const cartItemFixture: CartItem = {
  productId: productFixture.id,
  name: productFixture.name,
  price: productFixture.price,
  imageUrl: productFixture.imageUrl,
  quantity: 1,
};

export const userCustomerFixture: UserProfile = {
  uid: "u_1",
  email: "cliente@geekeame.test",
  role: "customer",
  createdAt: 1700000000000,
};
