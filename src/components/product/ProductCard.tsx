import { Link } from "react-router-dom";
import type { Product } from "../../types/product";

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      to={`/products/${product.id}`}
      className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
    >
      <img
        src={product.imageUrl}
        alt={product.name}
        className="w-full aspect-square object-cover"
      />
      <div className="p-3">
        <p className="font-medium text-sm">{product.name}</p>
        <p className="text-gray-600 text-sm">
          ${product.price.toLocaleString("es-CO")}
        </p>
      </div>
    </Link>
  );
}
