export type ProductCategoryId =
  | "pines"
  | "stickers"
  | "cuadros-punto-cruz"
  | "llaveros"
  | "tazas";

export interface Product {
  id: string;
  name: string;
  nameLower: string;
  categoryId: ProductCategoryId;
  price: number;
  stock: number;
  description: string;
  imageUrl: string;
  createdAt: number;
  updatedAt?: number;
}
