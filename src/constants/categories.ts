import type { ProductCategoryId } from "../types/product";
export interface CategoryOption {
  id: ProductCategoryId;
  label: string;
}

// Única fuente de verdad para las categorías: la va a usar el selector del
// form de admin. Si mañana agrego o renombro una categoría, se cambia
// acá una sola vez.
export const PRODUCT_CATEGORIES: CategoryOption[] = [
  { id: "pines", label: "Pines" },
  { id: "stickers", label: "Stickers" },
  { id: "cuadros-punto-cruz", label: "Cuadros punto de cruz" },
  { id: "llaveros", label: "Llaveros" },
  { id: "tazas", label: "Tazas" },
];
