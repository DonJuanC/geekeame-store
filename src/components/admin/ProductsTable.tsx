import { Link } from "react-router-dom";
import type { Product } from "../../types/product";
import { ProductImage } from "../product/ProductImage";

interface ProductRowProps {
  product: Product;
  isDeleting: boolean;
  onDelete: (product: Product) => void;
  dark: boolean;
}

function ProductRow({ product, isDeleting, onDelete, dark }: ProductRowProps) {
  return (
    <tr className={`border-b last:border-b-0 ${dark ? "border-[#2e2a45]" : ""}`}>
      <td className="p-2">
        <ProductImage
          product={product}
          className="w-12 h-12 object-cover rounded"
          emojiClassName="text-base"
          dark={dark}
        />
      </td>
      <td className="p-2 text-sm font-medium">{product.name}</td>
      <td className={`p-2 text-sm ${dark ? "text-[#9ca3af]" : "text-gray-600"}`}>
        {product.categoryId}
      </td>
      <td className="p-2 text-sm">${product.price.toLocaleString("es-CO")}</td>
      <td className="p-2 text-sm">
        <span className={product.stock === 0 ? (dark ? "text-[#f87171] font-medium" : "text-red-600 font-medium") : ""}>
          {product.stock}
        </span>
      </td>
      <td className="p-2 text-sm">
        <div className="flex gap-2 flex-wrap">
          <Link
            to={`/admin/products/${product.id}/edit`}
            className={`rounded-full border px-2.5 py-1 transition-colors ${isDeleting ? "pointer-events-none opacity-50" : ""} ${
              dark ? "border-[#3f3a5c] hover:bg-[#211d34]" : "border-[#ddd6fe] hover:bg-[#f5f3ff]"
            }`}
          >
            Editar
          </Link>
          <button
            onClick={() => onDelete(product)}
            disabled={isDeleting}
            className={`rounded-full border px-2.5 py-1 disabled:opacity-50 transition-colors ${
              dark
                ? "border-[#3f3a5c] text-[#f87171] hover:bg-[#211d34]"
                : "border-[#ddd6fe] text-red-600 hover:bg-[#fef2f2]"
            }`}
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
  dark?: boolean;
}

export function ProductsTable({
  products,
  deletingId,
  onDelete,
  dark = false,
}: ProductsTableProps) {
  return (
    <div className={`overflow-x-auto rounded-xl border ${dark ? "border-[#2e2a45]" : "border-[#ede9fe]"}`}>
      <table className="w-full text-left">
        <thead className={dark ? "bg-[#1c1a29]" : "bg-gray-50"}>
          <tr>
            <th className={`p-2 text-xs uppercase ${dark ? "text-[#9ca3af]" : "text-gray-500"}`}>Imagen</th>
            <th className={`p-2 text-xs uppercase ${dark ? "text-[#9ca3af]" : "text-gray-500"}`}>Nombre</th>
            <th className={`p-2 text-xs uppercase ${dark ? "text-[#9ca3af]" : "text-gray-500"}`}>Categoría</th>
            <th className={`p-2 text-xs uppercase ${dark ? "text-[#9ca3af]" : "text-gray-500"}`}>Precio</th>
            <th className={`p-2 text-xs uppercase ${dark ? "text-[#9ca3af]" : "text-gray-500"}`}>Stock</th>
            <th className={`p-2 text-xs uppercase ${dark ? "text-[#9ca3af]" : "text-gray-500"}`}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <ProductRow
              key={product.id}
              product={product}
              isDeleting={deletingId === product.id}
              onDelete={onDelete}
              dark={dark}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ProductsTableSkeleton({ dark = false }: { dark?: boolean }) {
  return (
    <div
      className={`overflow-x-auto rounded-xl border animate-pulse ${dark ? "border-[#2e2a45]" : "border-[#ede9fe]"}`}
    >
      <table className="w-full text-left">
        <tbody>
          {[0, 1, 2].map((row) => (
            <tr key={row} className={`border-b last:border-b-0 ${dark ? "border-[#2e2a45]" : ""}`}>
              {[0, 1, 2, 3, 4, 5].map((col) => (
                <td key={col} className="p-2">
                  <div className={`h-4 rounded ${dark ? "bg-[#2e2a45]" : "bg-gray-200"}`} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
