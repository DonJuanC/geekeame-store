import type { Product } from "../../types/product";
import {
  categoryEmoji,
  isPlaceholderImage,
  placeholderColor,
} from "../../utils/productPlaceholder";

interface ProductImageProps {
  // Pick en vez de Product completo: así CartItem (que ya trae imageUrl/
  // name/categoryId pero no el resto de campos de Product, como stock o
  // description) también se puede pasar tal cual desde CartPage sin
  // armar un objeto Product falso.
  product: Pick<Product, "imageUrl" | "name" | "categoryId">;
  // Se aplica tanto a la <img> real como al div del placeholder, así el
  // caller controla tamaño/bordes/aspect-ratio sin que importe cuál de
  // las dos ramas termina renderizando.
  className?: string;
  // Tamaño del emoji, separado de className porque cambia según el
  // contexto (card chica vs. detalle grande) mientras que className suele
  // repetirse igual en ambos casos.
  emojiClassName?: string;
  // No lee useTheme() internamente a propósito: hoy solo Home/ProductCard
  // tienen modo oscuro real, así que cada caller decide explícitamente si
  // corresponde el tono "joya" oscuro o el pastel de siempre.
  // ProductDetailPage/ProductsTable no lo pasan y siguen en claro sin
  // importar el toggle global, hasta que se extienda el dark mode ahí.
  dark?: boolean;
}

export function ProductImage({
  product,
  className = "",
  emojiClassName = "text-2xl",
  dark = false,
}: ProductImageProps) {
  if (!isPlaceholderImage(product.imageUrl)) {
    return <img src={product.imageUrl} alt={product.name} className={className} />;
  }

  return (
    <div
      className={`flex items-center justify-center ${emojiClassName} ${className}`}
      style={{ backgroundColor: placeholderColor(product.name, dark) }}
      role="img"
      aria-label={product.name}
    >
      {categoryEmoji(product.categoryId)}
    </div>
  );
}
