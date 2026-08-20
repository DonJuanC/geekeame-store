import type { ProductCategoryId } from "../types/product";

export function isPlaceholderImage(url: string): boolean {
  return url.includes("placehold.co");
}

const CATEGORY_EMOJI: Record<ProductCategoryId, string> = {
  pines: "📌",
  stickers: "🏷️",
  posters: "🖼️",
  llaveros: "🔑",
  tazas: "☕",
};

export function categoryEmoji(categoryId: ProductCategoryId): string {
  return CATEGORY_EMOJI[categoryId] ?? "🛍️";
}

function hashHue(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % 360;
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) =>
    l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const toHex = (x: number) =>
    Math.round(255 * x)
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
}

export function placeholderColor(seed: string, dark = false): string {
  return dark
    ? hslToHex(hashHue(seed), 55, 32)
    : hslToHex(hashHue(seed), 45, 90);
}
