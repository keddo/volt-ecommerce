import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Role } from "@personal-ecommerce/shared";
import { AuthProvider } from "./context/AuthContext";
import { LocaleProvider } from "./context/LocaleContext";
import { ToastProvider } from "./context/ToastContext";
import { WishlistProvider } from "./context/WishlistContext";
import { CartProvider } from "./context/CartContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { PublicLayout } from "./layouts/PublicLayout";
import { HomePage } from "./pages/public/HomePage";
import { ShopPage } from "./pages/public/ShopPage";
import { CategoryPage } from "./pages/public/CategoryPage";
import { ProductDetailPage } from "./pages/public/ProductDetailPage";
import { WishlistPage } from "./pages/public/WishlistPage";
import { CartPage } from "./pages/public/CartPage";
import { CheckoutPage } from "./pages/public/CheckoutPage";
import { OrdersPage } from "./pages/public/OrdersPage";
import { OrderDetailPage } from "./pages/public/OrderDetailPage";
import { AccountPage } from "./pages/public/AccountPage";
import { LoginPage } from "./pages/public/LoginPage";
import { RegisterPage } from "./pages/public/RegisterPage";

// Public shoppers never render any of this (ProtectedRoute keeps it admin-only), so it's
// code-split out of the main bundle instead of shipping to every storefront visitor.
const AdminLayout = lazy(() => import("./layouts/AdminLayout").then((m) => ({ default: m.AdminLayout })));
const AdminLoginPage = lazy(() => import("./pages/admin/AdminLoginPage").then((m) => ({ default: m.AdminLoginPage })));
const DashboardPage = lazy(() => import("./pages/admin/DashboardPage").then((m) => ({ default: m.DashboardPage })));
const ProductsPage = lazy(() => import("./pages/admin/ProductsPage").then((m) => ({ default: m.ProductsPage })));
const ProductFormPage = lazy(() => import("./pages/admin/ProductFormPage").then((m) => ({ default: m.ProductFormPage })));
const CategoriesPage = lazy(() => import("./pages/admin/CategoriesPage").then((m) => ({ default: m.CategoriesPage })));
const AdminOrdersPage = lazy(() => import("./pages/admin/OrdersPage").then((m) => ({ default: m.OrdersPage })));
const AdminOrderDetailPage = lazy(() => import("./pages/admin/OrderDetailPage").then((m) => ({ default: m.OrderDetailPage })));
const AdminReviewsPage = lazy(() => import("./pages/admin/ReviewsPage").then((m) => ({ default: m.ReviewsPage })));
const ComingSoonPage = lazy(() => import("./pages/admin/ComingSoonPage").then((m) => ({ default: m.ComingSoonPage })));

function AdminFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-navy">
      <div className="h-8 w-8 animate-pulse rounded-xl bg-white/10" />
    </div>
  );
}

export function App() {
  return (
    <LocaleProvider>
      <AuthProvider>
        <ToastProvider>
          <WishlistProvider>
            <CartProvider>
              <Routes>
                <Route element={<PublicLayout />}>
                  <Route index element={<HomePage />} />
                  <Route path="shop" element={<ShopPage />} />
                  <Route path="category/:slug" element={<CategoryPage />} />
                  <Route path="products/:slug" element={<ProductDetailPage />} />
                  <Route path="wishlist" element={<WishlistPage />} />
                  <Route path="cart" element={<CartPage />} />
                  <Route path="checkout" element={<CheckoutPage />} />
                  <Route path="orders" element={<OrdersPage />} />
                  <Route path="orders/:id" element={<OrderDetailPage />} />
                  <Route path="account" element={<AccountPage />} />
                  <Route path="login" element={<LoginPage />} />
                  <Route path="register" element={<RegisterPage />} />
                </Route>

                <Route
                  path="/admin/login"
                  element={
                    <Suspense fallback={<AdminFallback />}>
                      <AdminLoginPage />
                    </Suspense>
                  }
                />

                <Route path="/admin" element={<ProtectedRoute allow={[Role.ADMIN]} />}>
                  <Route
                    element={
                      <Suspense fallback={<AdminFallback />}>
                        <AdminLayout />
                      </Suspense>
                    }
                  >
                    <Route index element={<DashboardPage />} />
                    <Route path="products" element={<ProductsPage />} />
                    <Route path="products/new" element={<ProductFormPage />} />
                    <Route path="products/:id/edit" element={<ProductFormPage />} />
                    <Route path="categories" element={<CategoriesPage />} />
                    <Route path="orders" element={<AdminOrdersPage />} />
                    <Route path="orders/:id" element={<AdminOrderDetailPage />} />
                    <Route path="reviews" element={<AdminReviewsPage />} />
                    <Route path="*" element={<ComingSoonPage />} />
                  </Route>
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </CartProvider>
          </WishlistProvider>
        </ToastProvider>
      </AuthProvider>
    </LocaleProvider>
  );
}
