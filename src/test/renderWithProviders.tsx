import { render, type RenderOptions } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider } from "../contexts/AuthContext";
import { CartProvider } from "../contexts/CartContext";
import { ThemeProvider } from "../contexts/ThemeContext";
import { ProductsProvider } from "../contexts/ProductsContext";
import { FavoritesProvider } from "../contexts/FavoritesContext";

function Providers({ children }: { children: ReactNode }) {
  return (
    <MemoryRouter>
      <ThemeProvider>
        <AuthProvider>
          <FavoritesProvider>
            <ProductsProvider>
              <CartProvider>{children}</CartProvider>
            </ProductsProvider>
          </FavoritesProvider>
        </AuthProvider>
      </ThemeProvider>
    </MemoryRouter>
  );
}

export function renderWithProviders(ui: ReactNode, options?: RenderOptions) {
  return render(<>{ui}</>, { wrapper: Providers, ...options });
}
