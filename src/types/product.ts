export type ProductCategoryId =
  | "pines"
  | "stickers"
  | "posters"
  | "llaveros"
  | "tazas";

export interface Product {
  id: string;
  name: string;
  nameLower: string;
  searchKeywords: string[];
  categoryId: ProductCategoryId;
  price: number;
  stock: number;
  description: string;
  imageUrl: string;
  createdAt: number;
  updatedAt?: number;
}
