import { Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";
import { ScrollToTop } from "./components/layout/ScrollToTop";
import { RequireAdmin } from "./components/auth/RequireAdmin";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { HomePage } from "./pages/HomePage";
import { ProductDetailPage } from "./pages/ProductDetailPage";
import { CartPage } from "./pages/CartPage";
import { RequireAuth } from "./components/auth/RequireAuth";
import { CheckoutPage } from "./pages/CheckoutPage";
import { OrdersPage } from "./pages/OrdersPage";
import { OrderDetailPage } from "./pages/OrderDetailPage";
import { FavoritesPage } from "./pages/FavoritesPage";
import { useTheme } from "./hooks/useTheme";
import { LoadingState } from "./components/states/LoadingState";

const AdminLayout = lazy(() =>
  import("./pages/admin/AdminLayout").then((m) => ({ default: m.AdminLayout })),
);
const AdminProductsPage = lazy(() =>
  import("./pages/admin/AdminProductsPage").then((m) => ({
    default: m.AdminProductsPage,
  })),
);
const AdminProductFormPage = lazy(() =>
  import("./pages/admin/AdminProductFormPage").then((m) => ({
    default: m.AdminProductFormPage,
  })),
);
const AdminOrdersPage = lazy(() =>
  import("./pages/admin/AdminOrdersPage").then((m) => ({
    default: m.AdminOrdersPage,
  })),
);
const AdminAnalyticsPage = lazy(() =>
  import("./pages/admin/AdminAnalyticsPage").then((m) => ({
    default: m.AdminAnalyticsPage,
  })),
);
const AdminUsersPage = lazy(() =>
  import("./pages/admin/AdminUsersPage").then((m) => ({
    default: m.AdminUsersPage,
  })),
);

function AdminFallback() {
  const { theme } = useTheme();
  return <LoadingState label="Cargando panel admin..." dark={theme === "dark"} />;
}

function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/" element={<HomePage />} />
        <Route path="/products/:id" element={<ProductDetailPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route
          path="/checkout"
          element={
            <RequireAuth>
              <CheckoutPage />
            </RequireAuth>
          }
        />
        <Route
          path="/orders"
          element={
            <RequireAuth>
              <OrdersPage />
            </RequireAuth>
          }
        />
        <Route
          path="/orders/:id"
          element={
            <RequireAuth>
              <OrderDetailPage />
            </RequireAuth>
          }
        />
        <Route
          path="/favorites"
          element={
            <RequireAuth>
              <FavoritesPage />
            </RequireAuth>
          }
        />
        <Route
          path="/admin"
          element={
            <RequireAdmin>
              <Suspense fallback={<AdminFallback />}>
                <AdminLayout />
              </Suspense>
            </RequireAdmin>
          }
        >
          <Route index element={<AdminProductsPage />} />
          <Route path="products/new" element={<AdminProductFormPage />} />
          <Route path="products/:id/edit" element={<AdminProductFormPage />} />
          <Route path="orders" element={<AdminOrdersPage />} />
          <Route path="analytics" element={<AdminAnalyticsPage />} />
          <Route path="users" element={<AdminUsersPage />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;
