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
  // Prefijos en minúscula (sin tildes) de cada palabra del nombre, para
  // búsqueda por substring/palabra-parcial vía array-contains. Ver
  // buildSearchKeywords en productsService.
  searchKeywords: string[];
  categoryId: ProductCategoryId;
  price: number;
  stock: number;
  description: string;
  imageUrl: string;
  createdAt: number;
  updatedAt?: number;
}
