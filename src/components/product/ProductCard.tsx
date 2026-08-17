import { Link } from "react-router-dom";
import type { Product } from "../../types/product";
import { useCart } from "../../hooks/useCart";

export function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();

  function handleAdd() {
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl,
    });
  }

  return (
    <div className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
      <Link to={`/products/${product.id}`}>
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
      <button
        onClick={handleAdd}
        className="w-full border-t px-3 py-2 text-sm hover:bg-gray-50"
      >
        Agrega al carrito
      </button>
    </div>
  );
}
