import type { Product, ProductCategoryId } from "../types/product";

// Coincide con categoryMeta[categoryId].unit en scripts/seed.mjs -- el
// nombre de cada producto sembrado es literalmente `${unit} ${theme}`
// (ej. "Taza Dr. Stone", "Llavero The Last of Us"). Mostrar la categoría
// dentro del título Y como tag aparte es redundante -- categoryLabel da
// el texto del tag/badge, themeName corta ese prefijo del nombre para
// mostrar solo el tema en el título.
const CATEGORY_UNIT: Record<ProductCategoryId, string> = {
  pines: "Pin",
  stickers: "Sticker",
  posters: "Poster",
  llaveros: "Llavero",
  tazas: "Taza",
};

export function categoryLabel(categoryId: ProductCategoryId): string {
  return CATEGORY_UNIT[categoryId] ?? categoryId;
}

// Un color pastel fijo por categoría (no dependen del hash por producto
// como el fondo de ProductImage) para que el tag sirva de referencia
// visual rápida entre cards -- "todos los tazas son verdes", etc. Elegidos
// para no pisar el violeta/magenta que ya está reservado para
// marca/acción (login, botones, chips activos): si el tag también fuera
// violeta se confundiría con esos elementos interactivos. Pares texto
// oscuro/fondo claro de la misma familia, mismo criterio que ya se usa en
// el resto del sitio para mantener buen contraste (~7:1+, bien por
// encima del mínimo AA de 4.5:1 para texto normal).
const CATEGORY_TAG_COLORS: Record<
  ProductCategoryId,
  { bg: string; text: string }
> = {
  pines: { bg: "#fef3c7", text: "#b45309" },
  stickers: { bg: "#ccfbf1", text: "#0f766e" },
  posters: { bg: "#ffe4e6", text: "#be123c" },
  llaveros: { bg: "#dbeafe", text: "#1d4ed8" },
  tazas: { bg: "#dcfce7", text: "#15803d" },
};

export function categoryTagColors(categoryId: ProductCategoryId): {
  bg: string;
  text: string;
} {
  return CATEGORY_TAG_COLORS[categoryId] ?? { bg: "#f5f3ff", text: "#6d28d9" };
}

// Si el nombre empieza exactamente con "<unidad de la categoría> ",
// devuelve el resto ("Dr. Stone", "The Last of Us"). Si no matchea (por
// ejemplo un producto cargado a mano desde el admin sin seguir ese
// patrón), devuelve el nombre completo tal cual -- no rompe productos que
// no sigan la convención del seed.
export function themeName(product: Product): string {
  const prefix = `${categoryLabel(product.categoryId)} `;
  return product.name.startsWith(prefix)
    ? product.name.slice(prefix.length)
    : product.name;
}
