import { render, type RenderOptions } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider } from "../contexts/AuthContext";
import { CartProvider } from "../contexts/CartContext";
import { ThemeProvider } from "../contexts/ThemeContext";

// Wrapper único con los providers reales del proyecto (no mocks del context).
// A diferencia del patrón "preloadedAuth/preloadedCart" de otros proyectos,
// AuthProvider y CartProvider acá no aceptan estado inicial por props: leen
// su estado real de Firebase (mockeado a nivel de módulo con vi.mock) y de
// localStorage respectivamente. Por eso, para precargar un escenario en un
// test, hay que:
//   - Carrito: localStorage.setItem("geekeame-cart", JSON.stringify({items: [...]}))
//     antes de renderizar.
//   - Auth: mockear "firebase/auth" (onAuthStateChanged) y
//     "../services/authService" antes de renderizar.
// Se agrega MemoryRouter porque varias páginas usan useNavigate/Link.
// ThemeProvider se agregó junto con el modo claro/oscuro: StoreHeader,
// HomePage, ProductCard, AdminLayout y varias páginas más ahora llaman
// useTheme(), que revienta con "useTheme debe usarse dentro de
// <ThemeProvider>" si el árbol no lo tiene envuelto -- por eso vive acá
// (un solo lugar) y no hay que tocar cada test individual.
function Providers({ children }: { children: ReactNode }) {
  return (
    <MemoryRouter>
      <ThemeProvider>
        <AuthProvider>
          <CartProvider>{children}</CartProvider>
        </AuthProvider>
      </ThemeProvider>
    </MemoryRouter>
  );
}

export function renderWithProviders(ui: ReactNode, options?: RenderOptions) {
  return render(<>{ui}</>, { wrapper: Providers, ...options });
}
