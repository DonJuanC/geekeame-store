import type { Product } from "../../types/product";
import {
  categoryEmoji,
  isPlaceholderImage,
  placeholderColor,
} from "../../utils/productPlaceholder";

interface ProductImageProps {
  product: Pick<Product, "imageUrl" | "name" | "categoryId">;
  className?: string;
  emojiClassName?: string;
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
