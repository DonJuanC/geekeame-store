import type { Product, ProductCategoryId } from "../types/product";

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

export function themeName(product: Product): string {
  const prefix = `${categoryLabel(product.categoryId)} `;
  return product.name.startsWith(prefix)
    ? product.name.slice(prefix.length)
    : product.name;
}
