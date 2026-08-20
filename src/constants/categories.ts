import type { ProductCategoryId } from "../types/product";

export interface CategoryOption {
  id: ProductCategoryId;
  label: string;
}

export const PRODUCT_CATEGORIES: CategoryOption[] = [
  { id: "pines", label: "Pines" },
  { id: "stickers", label: "Stickers" },
  { id: "posters", label: "Posters" },
  { id: "llaveros", label: "Llaveros" },
  { id: "tazas", label: "Tazas" },
];
