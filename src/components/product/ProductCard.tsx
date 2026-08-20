import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { Product } from "../../types/product";
import { useCart } from "../../hooks/useCart";
import { useTheme } from "../../hooks/useTheme";
import { ProductImage } from "./ProductImage";
import { FavoriteButton } from "./FavoriteButton";
import { categoryLabel, categoryTagColors, themeName } from "../../utils/productDisplay";

export function ProductCard({ product }: { product: Product }) {
  const { items, addItem } = useCart();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const tagColors = categoryTagColors(product.categoryId);
  const [justAdded, setJustAdded] = useState(false);

  useEffect(() => {
    if (!justAdded) return;
    const timeout = setTimeout(() => setJustAdded(false), 1500);
    return () => clearTimeout(timeout);
  }, [justAdded]);

  const inCartQuantity =
    items.find((item) => item.productId === product.id)?.quantity ?? 0;
  const outOfStock = product.stock <= 0;
  const atStockLimit = !outOfStock && inCartQuantity >= product.stock;

  function handleAdd() {
    if (outOfStock || atStockLimit) return;
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl,
      categoryId: product.categoryId,
      stock: product.stock,
    });
    setJustAdded(true);
  }

  const buttonLabel = outOfStock
    ? "Sin stock"
    : justAdded
      ? `✓ Agregado (${inCartQuantity} en el carrito)`
      : atStockLimit
        ? "Alcanzaste el stock disponible"
        : "Agregar al carrito";

  return (
    <div
      className={`relative border rounded-xl overflow-hidden transition-all hover:-translate-y-0.5 ${
        isDark
          ? "bg-[#1c1a29] border-[#2e2a45] hover:border-[#7c3aed]"
          : "bg-white border-[#ede9fe] hover:shadow-lg"
      }`}
    >
      <FavoriteButton productId={product.id} className="absolute top-2 right-2 z-10" />
      <Link to={`/products/${product.id}`}>
        <ProductImage
          product={product}
          className="w-full aspect-square object-cover"
          dark={isDark}
        />
        <div className="p-3">
          <span
            className="inline-block text-[10px] font-medium uppercase tracking-wide rounded-full px-2 py-0.5 mb-1"
            style={{ backgroundColor: tagColors.bg, color: tagColors.text }}
          >
            {categoryLabel(product.categoryId)}
          </span>
          <p
            className={`font-medium text-sm line-clamp-1 ${
              isDark ? "text-[#f5f3ff]" : "text-[#1a1625]"
            }`}
          >
            {themeName(product)}
          </p>
          <p
            className={`font-bold text-sm mt-1 ${
              isDark ? "text-[#f9a8d4]" : "text-[#db2777]"
            }`}
          >
            ${product.price.toLocaleString("es-CO")}
          </p>
        </div>
      </Link>
      <button
        onClick={handleAdd}
        disabled={outOfStock || atStockLimit}
        className={`w-full border-t px-3 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
          isDark
            ? "border-[#2e2a45] text-[#c4b5fd] hover:bg-[#211d34]"
            : "border-[#ede9fe] text-[#6d28d9] hover:bg-[#f5f3ff]"
        }`}
      >
        {buttonLabel}
      </button>
    </div>
  );
}
