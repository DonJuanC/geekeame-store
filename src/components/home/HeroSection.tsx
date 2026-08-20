import { PRODUCT_CATEGORIES } from "../../constants/categories";
import { categoryEmoji } from "../../utils/productPlaceholder";

const FLOATERS: Array<{
  categoryIndex: number;
  top: string;
  left: string;
  size: string;
  opacity: string;
  delay: string;
  duration: string;
}> = [
  { categoryIndex: 0, top: "6%", left: "4%", size: "text-5xl", opacity: "opacity-25", delay: "0s", duration: "5s" },
  { categoryIndex: 1, top: "10%", left: "20%", size: "text-3xl", opacity: "opacity-20", delay: "0.8s", duration: "4.2s" },
  { categoryIndex: 2, top: "5%", left: "38%", size: "text-4xl", opacity: "opacity-15", delay: "1.4s", duration: "5.8s" },
  { categoryIndex: 3, top: "9%", left: "58%", size: "text-3xl", opacity: "opacity-20", delay: "0.4s", duration: "4.6s" },
  { categoryIndex: 4, top: "6%", left: "76%", size: "text-5xl", opacity: "opacity-25", delay: "1.8s", duration: "5.2s" },
  { categoryIndex: 0, top: "14%", left: "92%", size: "text-4xl", opacity: "opacity-20", delay: "1s", duration: "6s" },
  { categoryIndex: 1, top: "34%", left: "10%", size: "text-4xl", opacity: "opacity-20", delay: "2.2s", duration: "5s" },
  { categoryIndex: 2, top: "30%", left: "90%", size: "text-3xl", opacity: "opacity-15", delay: "0.6s", duration: "4.4s" },
  { categoryIndex: 3, top: "42%", left: "48%", size: "text-3xl", opacity: "opacity-15", delay: "1.6s", duration: "5.6s" },
  { categoryIndex: 4, top: "55%", left: "3%", size: "text-4xl", opacity: "opacity-20", delay: "0.2s", duration: "4.8s" },
  { categoryIndex: 0, top: "58%", left: "94%", size: "text-4xl", opacity: "opacity-25", delay: "1.2s", duration: "5.4s" },
  { categoryIndex: 1, top: "64%", left: "18%", size: "text-3xl", opacity: "opacity-15", delay: "2.6s", duration: "4s" },
  { categoryIndex: 2, top: "68%", left: "80%", size: "text-5xl", opacity: "opacity-20", delay: "0.9s", duration: "5.9s" },
  { categoryIndex: 3, top: "80%", left: "8%", size: "text-4xl", opacity: "opacity-25", delay: "1.5s", duration: "4.7s" },
  { categoryIndex: 4, top: "84%", left: "30%", size: "text-3xl", opacity: "opacity-20", delay: "0.3s", duration: "5.3s" },
  { categoryIndex: 0, top: "82%", left: "66%", size: "text-4xl", opacity: "opacity-20", delay: "2s", duration: "4.3s" },
  { categoryIndex: 1, top: "78%", left: "88%", size: "text-3xl", opacity: "opacity-15", delay: "1.1s", duration: "5.7s" },
  { categoryIndex: 2, top: "24%", left: "65%", size: "text-2xl", opacity: "opacity-15", delay: "0.7s", duration: "4.9s" },
];

export function HeroSection() {
  return (
    <section
      className="relative overflow-hidden bg-gradient-to-br from-[#7c3aed] via-[#a21caf] to-[#db2777]"
      aria-label="Bienvenida"
    >
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        {FLOATERS.map((f, i) => (
          <span
            key={i}
            className={`hero-float absolute ${f.size} ${f.opacity} select-none`}
            style={{
              top: f.top,
              left: f.left,
              animationDelay: f.delay,
              animationDuration: f.duration,
            }}
          >
            {categoryEmoji(PRODUCT_CATEGORIES[f.categoryIndex].id)}
          </span>
        ))}
      </div>

      <div className="hero-fade-in-up relative max-w-5xl mx-auto px-4 py-16 sm:py-20 text-center">
        <h1 className="font-['Fredoka',_sans-serif] text-3xl sm:text-5xl font-semibold text-white drop-shadow-sm">
          Geekeame tu espacio
        </h1>
        <p className="mt-3 text-base sm:text-lg text-[#f5f3ff] max-w-md mx-auto">
          Pines, stickers, posters y más para que tu escritorio, tu cuarto o
          tu morral griten lo que amas.
        </p>
        <a
          href="#catalogo"
          className="inline-block mt-7 rounded-full bg-white px-6 py-2.5 font-medium text-[#6d28d9] hover:bg-[#f5f3ff] transition-colors"
        >
          Ver catálogo
        </a>
      </div>
    </section>
  );
}
