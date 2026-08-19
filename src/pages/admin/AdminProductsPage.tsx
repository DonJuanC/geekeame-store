import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "../../hooks/useTheme";
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
  const { theme } = useTheme();
  const isDark = theme === "dark";
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
      .catch((err) => {
        console.error(err);
        setStatus("error");
      });
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
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-xl font-bold">Productos</h1>
        <Link
          to="/admin/products/new"
          className="rounded-full px-3 py-2 text-sm font-medium bg-[#7c3aed] text-white hover:bg-[#6d28d9] transition-colors"
        >
          + Nuevo producto
        </Link>
      </div>

      {actionError && (
        <p
          role="alert"
          className={isDark ? "text-[#f87171] text-sm" : "text-red-600 text-sm"}
        >
          {actionError}
        </p>
      )}

      {status === "loading" && <ProductsTableSkeleton dark={isDark} />}
      {status === "error" && (
        <ErrorState
          message="No pudimos cargar los productos."
          onRetry={handleRetry}
          dark={isDark}
        />
      )}
      {status === "idle" && products.length === 0 && (
        <EmptyState message="Todavía no hay productos en el catálogo." dark={isDark} />
      )}
      {status === "idle" && products.length > 0 && (
        <ProductsTable
          products={products}
          deletingId={deletingId}
          onDelete={handleDelete}
          dark={isDark}
        />
      )}
    </div>
  );
}
