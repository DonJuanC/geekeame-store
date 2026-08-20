import type { Product } from "../types/product";

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
