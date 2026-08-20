import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "../../hooks/useTheme";
import {
  deleteProduct,
  listAllProductsForAdmin,
} from "../../services/productsService";
import type { Product } from "../../types/product";
import { PRODUCT_CATEGORIES } from "../../constants/categories";
import { filterAdminProducts } from "../../utils/filterAdminProducts";
import {
  ProductsTable,
  ProductsTableSkeleton,
} from "../../components/admin/ProductsTable";
import { EmptyState } from "../../components/states/EmptyState";
import { ErrorState } from "../../components/states/ErrorState";
import { AdminPageTitle } from "../../components/admin/AdminPageTitle";

type Status = "loading" | "idle" | "error";

export function AdminProductsPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [products, setProducts] = useState<Product[]>([]);
  const [status, setStatus] = useState<Status>("loading");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | "all">("all");
  const [searchTerm, setSearchTerm] = useState("");

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

  const visibleProducts = filterAdminProducts(
    products,
    categoryFilter,
    searchTerm,
  );
  const hasActiveFilter = categoryFilter !== "all" || searchTerm.trim() !== "";

  return (
    <div className="flex flex-col gap-4">
      <AdminPageTitle
        title="Productos"
        action={
          <Link
            to="/admin/products/new"
            className="rounded-full px-3 py-2 text-sm font-medium bg-[#7c3aed] text-white hover:bg-[#6d28d9] transition-colors"
          >
            + Nuevo producto
          </Link>
        }
      />

      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="search"
          aria-label="Buscar productos por nombre"
          placeholder="Buscar por nombre..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={`rounded-full px-4 py-2 flex-1 border focus:outline-none focus:ring-2 focus:ring-[#c4b5fd] ${
            isDark
              ? "bg-[#161320] border-[#2e2a45] text-[#f5f3ff] placeholder:text-[#6b6485]"
              : "border-[#ede9fe]"
          }`}
        />
        <div className="flex gap-2 overflow-x-auto text-sm">
          <button
            onClick={() => setCategoryFilter("all")}
            aria-pressed={categoryFilter === "all"}
            className={`rounded-full border px-3 py-1 whitespace-nowrap transition-colors ${
              categoryFilter === "all"
                ? "bg-[#7c3aed] border-[#7c3aed] text-white"
                : isDark
                  ? "border-[#3f3a5c] text-[#c4b5fd] hover:bg-[#211d34]"
                  : "border-[#ddd6fe] hover:bg-[#f5f3ff]"
            }`}
          >
            Todas
          </button>
          {PRODUCT_CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => setCategoryFilter(c.id)}
              aria-pressed={categoryFilter === c.id}
              className={`rounded-full border px-3 py-1 whitespace-nowrap transition-colors ${
                categoryFilter === c.id
                  ? "bg-[#7c3aed] border-[#7c3aed] text-white"
                  : isDark
                    ? "border-[#3f3a5c] text-[#c4b5fd] hover:bg-[#211d34]"
                    : "border-[#ddd6fe] hover:bg-[#f5f3ff]"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
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
      {status === "idle" && products.length > 0 && visibleProducts.length === 0 && (
        <EmptyState
          message="Ningún producto coincide con el filtro."
          actionLabel={hasActiveFilter ? "Limpiar filtros" : undefined}
          onAction={
            hasActiveFilter
              ? () => {
                  setCategoryFilter("all");
                  setSearchTerm("");
                }
              : undefined
          }
          dark={isDark}
        />
      )}
      {status === "idle" && visibleProducts.length > 0 && (
        <ProductsTable
          products={visibleProducts}
          deletingId={deletingId}
          onDelete={handleDelete}
          dark={isDark}
        />
      )}
    </div>
  );
}
