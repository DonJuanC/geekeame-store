import type { Product } from "../../types/product";
import { ProductCard } from "./ProductCard";

// Grid de productos repetida tal cual en HomePage (Destacados + catálogo
// completo) -- mismo className, mismo mapeo a ProductCard, antes duplicado
// dos veces en el mismo archivo.
export function ProductGrid({ products }: { products: Product[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
