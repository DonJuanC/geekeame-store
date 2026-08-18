import type { ProductCategoryId } from "../types/product";

export interface CategoryOption {
  id: ProductCategoryId;
  label: string;
}

// Única fuente de verdad para las categorías: la usan tanto el filtro del
// catálogo público (HomePage) como el selector del form de admin. Antes
// vivía duplicada en HomePage.tsx; centralizarla evita que ambas listas se
// desincronicen si se agrega o renombra una categoría.
export const PRODUCT_CATEGORIES: CategoryOption[] = [
  { id: "pines", label: "Pines" },
  { id: "stickers", label: "Stickers" },
  { id: "posters", label: "Posters" },
  { id: "llaveros", label: "Llaveros" },
  { id: "tazas", label: "Tazas" },
];
