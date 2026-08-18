import type { ProductCategoryId } from "../types/product";

// Los productos de prueba (scripts/seed.mjs) usan placehold.co con el
// nombre completo del producto como texto sobre un color -- se ve mal
// (bloque de color con texto apretado y cortado). En vez de re-sembrar
// Firestore para arreglarlo, se detecta acá y se reemplaza en el render
// por un emoji de categoría sobre el mismo color determinístico. Cuando
// un producto tenga foto real (uploadProductImage sube a S3), esa URL no
// matchea "placehold.co" y se muestra la imagen normal -- ver
// ProductImage.tsx.
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

// Mismo algoritmo que colorForTheme en scripts/seed.mjs (hash del string
// -> tono HSL fijo en saturación/luminosidad, para que el resultado sea
// siempre vívido y legible con texto/emoji blanco encima). No hace falta
// que devuelva el MISMO color exacto que el seed generó en su momento
// (ese quedó guardado en el placehold.co viejo que ya no usamos) -- solo
// que sea determinístico por producto, para que no cambie de color en
// cada render.
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

// Pastel (saturación baja, luminosidad alta) en vez del tono vívido que
// usa seed.mjs para el placehold.co viejo: con 8-12 cards juntas en la
// grilla, bloques 100% saturados compiten entre sí y cansan la vista. El
// emoji ya aporta el color/personalidad, no hace falta que el fondo grite
// también -- ver también el emojiClassName más chico en cada uso de
// ProductImage.
// dark=true da un tono "joya" (más saturado y oscuro) en vez del pastel
// clarito: contra un fondo casi negro, un pastel l=90 se ve lavado/apagado.
// Sigue siendo legible con el emoji encima y suficientemente oscuro para
// no competir con el fondo de la página.
export function placeholderColor(seed: string, dark = false): string {
  return dark
    ? hslToHex(hashHue(seed), 55, 32)
    : hslToHex(hashHue(seed), 45, 90);
}
