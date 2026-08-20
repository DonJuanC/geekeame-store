import { PRODUCT_CATEGORIES } from "../../constants/categories";
import { categoryEmoji, placeholderColor } from "../../utils/productPlaceholder";
import type { ProductCategoryId } from "../../types/product";

interface CategoryTilesProps {
  onSelect: (id: ProductCategoryId) => void;
  dark: boolean;
}

export function CategoryTiles({ onSelect, dark }: CategoryTilesProps) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
      {PRODUCT_CATEGORIES.map((c) => (
        <button
          key={c.id}
          onClick={() => onSelect(c.id)}
          className={`rounded-xl border p-4 flex flex-col items-center gap-2 transition-all hover:-translate-y-0.5 ${
            dark
              ? "bg-[#1c1a29] border-[#2e2a45] hover:border-[#7c3aed]"
              : "bg-white border-[#ede9fe] hover:shadow-lg"
          }`}
        >
          <span
            className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
            style={{ backgroundColor: placeholderColor(c.id, dark) }}
          >
            {categoryEmoji(c.id)}
          </span>
          <span
            className={`text-sm font-medium ${
              dark ? "text-[#f5f3ff]" : "text-[#1a1625]"
            }`}
          >
            {c.label}
          </span>
        </button>
      ))}
    </div>
  );
}
