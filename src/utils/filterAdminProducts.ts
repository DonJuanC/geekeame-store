import type { Product } from "../types/product";

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
