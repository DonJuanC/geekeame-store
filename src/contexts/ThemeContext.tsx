import { useEffect, useState, type ReactNode } from "react";
import { ThemeContext, type Theme } from "../hooks/useTheme";

const STORAGE_KEY = "geekeame-theme";

// Preferencia guardada > prefers-color-scheme del sistema > "light" por
// defecto. localStorage puede fallar (modo incógnito con storage
// bloqueado, etc.) -- si tira, se sigue con la detección de sistema en
// vez de romper el render inicial.
function getInitialTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    // sigue abajo con la detección de sistema
  }
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

// Nota de alcance: por ahora el toggle solo cambia de verdad la vista de
// Home + header + product cards (las páginas ya rediseñadas). El resto
// del sitio (detalle de producto, carrito, checkout, admin, etc.)
// todavía no tiene estilos dark -- seguirá viéndose en modo claro sin
// importar el valor de "theme" hasta que se extienda ese trabajo. Es
// esperado, no un bug.
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // si no se puede persistir, el toggle sigue funcionando en memoria
      // durante la sesión, solo no sobrevive un refresh
    }
  }, [theme]);

  function toggleTheme() {
    setTheme((t) => (t === "light" ? "dark" : "light"));
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
