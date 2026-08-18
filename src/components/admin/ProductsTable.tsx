import { Link } from "react-router-dom";
import type { Product } from "../../types/product";

interface ProductRowProps {
  product: Product;
  isDeleting: boolean;
  onDelete: (product: Product) => void;
}

function ProductRow({ product, isDeleting, onDelete }: ProductRowProps) {
  return (
    <tr className="border-b last:border-b-0">
      <td className="p-2">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-12 h-12 object-cover rounded"
        />
      </td>
      <td className="p-2 text-sm font-medium">{product.name}</td>
      <td className="p-2 text-sm text-gray-600">{product.categoryId}</td>
      <td className="p-2 text-sm">${product.price.toLocaleString("es-CO")}</td>
      <td className="p-2 text-sm">
        <span className={product.stock === 0 ? "text-red-600 font-medium" : ""}>
          {product.stock}
        </span>
      </td>
      <td className="p-2 text-sm">
        <div className="flex gap-2">
          <Link
            to={`/admin/products/${product.id}/edit`}
            className={`border rounded px-2 py-1 ${isDeleting ? "pointer-events-none opacity-50" : ""}`}
          >
            Editar
          </Link>
          <button
            onClick={() => onDelete(product)}
            disabled={isDeleting}
            className="border rounded px-2 py-1 text-red-600 disabled:opacity-50"
          >
            {isDeleting ? "Eliminando…" : "Eliminar"}
          </button>
        </div>
      </td>
    </tr>
  );
}

interface ProductsTableProps {
  products: Product[];
  deletingId: string | null;
  onDelete: (product: Product) => void;
}

export function ProductsTable({
  products,
  deletingId,
  onDelete,
}: ProductsTableProps) {
  return (
    <div className="overflow-x-auto border rounded">
      <table className="w-full text-left">
        <thead className="bg-gray-50">
          <tr>
            <th className="p-2 text-xs uppercase text-gray-500">Imagen</th>
            <th className="p-2 text-xs uppercase text-gray-500">Nombre</th>
            <th className="p-2 text-xs uppercase text-gray-500">Categoría</th>
            <th className="p-2 text-xs uppercase text-gray-500">Precio</th>
            <th className="p-2 text-xs uppercase text-gray-500">Stock</th>
            <th className="p-2 text-xs uppercase text-gray-500">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <ProductRow
              key={product.id}
              product={product}
              isDeleting={deletingId === product.id}
              onDelete={onDelete}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ProductsTableSkeleton() {
  return (
    <div className="overflow-x-auto border rounded animate-pulse">
      <table className="w-full text-left">
        <tbody>
          {[0, 1, 2].map((row) => (
            <tr key={row} className="border-b last:border-b-0">
              {[0, 1, 2, 3, 4, 5].map((col) => (
                <td key={col} className="p-2">
                  <div className="h-4 bg-gray-200 rounded" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
