export interface Product {
  id: string;
  name: string;
  nameLower: string;
  categoryId:
    | "pines"
    | "stickers"
    | "cuadros-punto-cruz"
    | "llaveros"
    | "tazas";
  price: number;
  stock: number;
  description: string;
  imageUrl: string;
  createdAt: number;
  updatedAt?: number;
}
