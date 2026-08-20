import type { ReactNode } from "react";
import { ThemeProvider } from "./ThemeContext";
import { AuthProvider } from "./AuthContext";
import { FavoritesProvider } from "./FavoritesContext";
import { ProductsProvider } from "./ProductsContext";
import { CartProvider } from "./CartContext";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <FavoritesProvider>
          <ProductsProvider>
            <CartProvider>{children}</CartProvider>
          </ProductsProvider>
        </FavoritesProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
