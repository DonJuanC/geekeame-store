import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useTheme } from "../hooks/useTheme";
import { StoreHeader } from "../components/layout/StoreHeader";
import { getProductById } from "../services/productsService";
import { LoadingState } from "../components/states/LoadingState";
import { ErrorState } from "../components/states/ErrorState";
import type { Product } from "../types/product";
import { useCart } from "../hooks/useCart";
import { ProductReviews } from "../components/product/ProductReviews";
import { ProductImage } from "../components/product/ProductImage";
import { FavoriteButton } from "../components/product/FavoriteButton";
import { categoryLabel, categoryTagColors, themeName } from "../utils/productDisplay";

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [product, setProduct] = useState<Product | null>(null);
  const [status, setStatus] = useState<"idle" | "error" | "not-found">(
    "idle",
  );
  // Id para el que "product"/"status" ya son válidos. Mientras no coincida
  // con el id actual de la ruta seguimos "cargando" -- se deriva más abajo
  // en vez de resetear con un setStatus("loading") síncrono al arrancar el
  // efecto (react-hooks/set-state-in-effect). Mismo patrón que
  // AdminProductFormPage.
  const [loadedId, setLoadedId] = useState<string | null>(null);
  const { addItem } = useCart();

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    getProductById(id)
      .then((p) => {
        if (cancelled) return;
        setLoadedId(id);
        if (!p) {
          setStatus("not-found");
          return;
        }
        setProduct(p);
        setStatus("idle");
      })
      .catch(() => {
        if (cancelled) return;
        setLoadedId(id);
        setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const isLoading = Boolean(id) && loadedId !== id;

  const shellClass = `min-h-screen ${isDark ? "bg-[#0f0e17] text-[#f5f3ff]" : "bg-white"}`;

  if (isLoading) {
    return (
      <div className={shellClass}>
        <StoreHeader />
        <LoadingState label="Cargando producto..." dark={isDark} />
      </div>
    );
  }
  if (status === "error") {
    return (
      <div className={shellClass}>
        <StoreHeader />
        <ErrorState message="No pudimos cargar este producto." dark={isDark} />
      </div>
    );
  }
  if (status === "not-found" || !product) {
    return (
      <div className={shellClass}>
        <StoreHeader />
        <ErrorState message="Este producto no existe." dark={isDark} />
      </div>
    );
  }

  return (
    <div className={shellClass}>
      <StoreHeader />
      <div className="p-4 max-w-2xl mx-auto">
        <Link
          to="/"
          className={`text-sm font-medium ${
            isDark ? "text-[#c4b5fd] hover:text-[#a78bfa]" : "text-[#6d28d9] hover:text-[#4c1d95]"
          }`}
        >
          ← Volver al catálogo
        </Link>
        <div className="relative">
          <ProductImage
            product={product}
            className="w-full aspect-square object-cover rounded-lg my-4"
            emojiClassName="text-4xl"
            dark={isDark}
          />
          <FavoriteButton productId={product.id} className="absolute top-6 right-2 z-10" />
        </div>
        <span
          className="inline-block text-xs font-medium uppercase tracking-wide rounded-full px-2 py-0.5 mt-1"
          style={{
            backgroundColor: categoryTagColors(product.categoryId).bg,
            color: categoryTagColors(product.categoryId).text,
          }}
        >
          {categoryLabel(product.categoryId)}
        </span>
        <h1 className="text-xl font-bold mt-1">{themeName(product)}</h1>
        <p className={isDark ? "text-[#9ca3af] my-2" : "text-gray-600 my-2"}>
          {product.description}
        </p>
        <p className={`text-lg font-bold ${isDark ? "text-[#f9a8d4]" : "text-[#db2777]"}`}>
          ${product.price.toLocaleString("es-CO")}
        </p>
        <button
          onClick={() =>
            addItem({
              productId: product.id,
              name: product.name,
              price: product.price,
              imageUrl: product.imageUrl,
              categoryId: product.categoryId,
            })
          }
          className="rounded-full px-4 py-2.5 mt-3 font-medium bg-[#7c3aed] text-white hover:bg-[#6d28d9] transition-colors"
        >
          Agregar al carrito
        </button>

        <ProductReviews productId={product.id} />
      </div>
    </div>
  );
}
