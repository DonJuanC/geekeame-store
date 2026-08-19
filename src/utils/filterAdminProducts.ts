import type { Product } from "../types/product";

// Filtro cliente-side de la tabla de productos del panel admin. La lista
// completa ya está en memoria (listAllProductsForAdmin trae hasta 500 de
// una sola vez), así que filtrar acá evita una query nueva a Firestore --
// y por lo tanto un índice compuesto nuevo -- solo para buscar/filtrar algo
// que ya se tiene cargado. Reusa nameLower (ya precomputado al guardar el
// producto, ver productsService.ts) en vez de un array-contains de
// searchKeywords: acá alcanza substring simple, no hace falta el mismo
// mecanismo de prefijos que usa la búsqueda pública.
export function filterAdminProducts(
  products: Product[],
  categoryFilter: string | "all",
  searchTerm: string,
): Product[] {
  const term = searchTerm.trim().toLowerCase();
  return products.filter((p) => {
    const matchesCategory =
      categoryFilter === "all" || p.categoryId === categoryFilter;
    const matchesSearch = term === "" || p.nameLower.includes(term);
    return matchesCategory && matchesSearch;
  });
}
