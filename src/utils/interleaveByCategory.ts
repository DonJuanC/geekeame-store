import type { Product } from "../types/product";

// Combina los grupos que devuelve listFeaturedCandidates (uno por
// categoría, cada uno ya ordenado por createdAt desc) alternando entre
// categorías en vez de agotar una antes de pasar a la siguiente: primera
// ronda toma el más reciente de CADA categoría, segunda ronda el segundo
// más reciente de cada una que todavía tenga, etc. Un simple concat + slice
// hubiera dejado la vitrina corrida hacia las categorías con más grupos/
// stock reciente (ver el bug real: Destacados terminaba siendo 5 tazas y
// 1 llavero) en vez de alternar.
//
// Vive en utils/ (no en HomePage.tsx) porque react-refresh/only-export-
// components no permite exportar funciones sueltas junto a un componente
// en el mismo archivo -- rompe Fast Refresh en dev.
export function interleaveByCategory(
  groups: Product[][],
  count: number,
): Product[] {
  const featured: Product[] = [];
  let round = 0;

  while (featured.length < count) {
    let addedThisRound = false;
    for (const group of groups) {
      if (featured.length >= count) break;
      const product = group[round];
      if (!product) continue;
      featured.push(product);
      addedThisRound = true;
    }
    if (!addedThisRound) break;
    round++;
  }

  return featured;
}
