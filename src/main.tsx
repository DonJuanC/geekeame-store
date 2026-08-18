import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext.tsx";
import "./index.css";
import App from "./App.tsx";
import { ProductsProvider } from "./contexts/ProductsContext.tsx";
import { CartProvider } from "./contexts/CartContext.tsx";
import { ThemeProvider } from "./contexts/ThemeContext.tsx";
import { FavoritesProvider } from "./contexts/FavoritesContext.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          {/* FavoritesProvider depende de useAuth() (necesita saber de
              quién son las listas a traer) -- por eso va anidado adentro
              de AuthProvider, igual que ProductsProvider/CartProvider. */}
          <FavoritesProvider>
            <ProductsProvider>
              <CartProvider>
                <App />
              </CartProvider>
            </ProductsProvider>
          </FavoritesProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
);
