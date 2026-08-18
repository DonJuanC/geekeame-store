import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  deleteProduct,
  listAllProductsForAdmin,
} from "../../services/productsService";
import type { Product } from "../../types/product";
import {
  ProductsTable,
  ProductsTableSkeleton,
} from "../../components/admin/ProductsTable";
import { EmptyState } from "../../components/states/EmptyState";
import { ErrorState } from "../../components/states/ErrorState";

type Status = "loading" | "idle" | "error";

export function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [status, setStatus] = useState<Status>("loading");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Nada de setState síncrono al arrancar acá (ni "loading" ni limpiar
  // actionError): el estado inicial ya es "loading"/null, y resetearlos
  // igual al arrancar el efecto dispara react-hooks/set-state-in-effect
  // (la regla nueva de eslint-plugin-react-hooks v7). El reintento manual
  // sí necesita resetear ambos explícitamente -- lo hace handleRetry, que
  // corre desde un click, no desde un efecto.
  const fetchProducts = useCallback(() => {
    return listAllProductsForAdmin()
      .then((result) => {
        setProducts(result);
        setStatus("idle");
      })
      .catch(() => setStatus("error"));
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  function handleRetry() {
    setStatus("loading");
    setActionError(null);
    fetchProducts();
  }

  async function handleDelete(product: Product) {
    const confirmed = window.confirm(
      `¿Eliminar "${product.name}"? Esta acción no se puede deshacer.`,
    );
    if (!confirmed) return;

    setDeletingId(product.id);
    setActionError(null);
    try {
      await deleteProduct(product.id);
      setProducts((current) => current.filter((p) => p.id !== product.id));
    } catch (err) {
      setActionError(
        err instanceof Error
          ? err.message
          : "No pudimos eliminar el producto. Intenta de nuevo.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Productos</h1>
        <Link
          to="/admin/products/new"
          className="border rounded px-3 py-1 text-sm bg-black text-white"
        >
          + Nuevo producto
        </Link>
      </div>

      {actionError && <p className="text-red-600 text-sm">{actionError}</p>}

      {status === "loading" && <ProductsTableSkeleton />}
      {status === "error" && (
        <ErrorState
          message="No pudimos cargar los productos."
          onRetry={handleRetry}
        />
      )}
      {status === "idle" && products.length === 0 && (
        <EmptyState message="Todavía no hay productos en el catálogo." />
      )}
      {status === "idle" && products.length > 0 && (
        <ProductsTable
          products={products}
          deletingId={deletingId}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
