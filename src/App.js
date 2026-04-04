/**
 * Main App Component
 * المكون الرئيسي للتطبيق
 */

import React, { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store/store';
import MainLayout from './layouts/MainLayout';
import AdminLayout from './layouts/AdminLayout';
import ProtectedRoute from './components/common/ProtectedRoute';
import AuthRedirect from './components/common/AuthRedirect';
import VerificationRequiredGate from './components/common/VerificationRequiredGate';
import ErrorBoundary from './components/common/ErrorBoundary';
import { PageLoader } from './components/common/Loading';
import { ROUTES } from './constants/routes';
import { logEnvironmentValidation } from './utils/envValidation';
import { setupTokenExpirationListener } from './utils/tokenManager';

// Lazy load pages for code splitting
const Home = lazy(() => import('./pages/Home'));
const Products = lazy(() => import('./pages/Products'));
const ProductDetails = lazy(() => import('./pages/ProductDetails'));
const Cart = lazy(() => import('./pages/Cart'));
const Checkout = lazy(() => import('./pages/Checkout'));
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));
const VerifyEmail = lazy(() => import('./pages/auth/VerifyEmail'));

// Admin Pages (lazy loaded)
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const AdminProducts = lazy(() => import('./pages/admin/ProductsManagement'));
const AdminAddProduct = lazy(() => import('./pages/admin/AddProduct'));
const AdminEditProduct = lazy(() => import('./pages/admin/EditProduct'));
const AdminCategories = lazy(() => import('./pages/admin/CategoriesManagement'));
const AdminOrders = lazy(() => import('./pages/admin/OrdersManagement'));
const AdminUsers = lazy(() => import('./pages/admin/UsersManagement'));
const AdminInventory = lazy(() => import('./pages/admin/InventoryManagement'));

// Profile and Orders pages
const Profile = lazy(() => import('./pages/Profile'));
const Orders = lazy(() => import('./pages/Orders'));
const OrderDetails = lazy(() => import('./pages/OrderDetails'));

// Information Pages (lazy loaded)
const ContactUs = lazy(() => import('./pages/ContactUs'));
const FAQ = lazy(() => import('./pages/FAQ'));
const ShippingInfo = lazy(() => import('./pages/ShippingInfo'));
const Returns = lazy(() => import('./pages/Returns'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const TermsOfService = lazy(() => import('./pages/TermsOfService'));
const CookiePolicy = lazy(() => import('./pages/CookiePolicy'));

function App() {
  // Validate environment on app startup
  useEffect(() => {
    logEnvironmentValidation();

    // Setup token expiration monitoring
    const unsubscribe = setupTokenExpirationListener();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  return (
    <ErrorBoundary>
      <Provider store={store}>
        <Router>
          <AuthRedirect />
          <VerificationRequiredGate>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Public Routes */}
                <Route
                  path={ROUTES.HOME}
                  element={
                    <MainLayout>
                      <Home />
                    </MainLayout>
                  }
                />
                <Route
                  path={ROUTES.PRODUCTS}
                  element={
                    <MainLayout>
                      <Products />
                    </MainLayout>
                  }
                />
                <Route
                  path={ROUTES.PRODUCT_DETAILS}
                  element={
                    <MainLayout>
                      <ProductDetails />
                    </MainLayout>
                  }
                />
                <Route
                  path={ROUTES.LOGIN}
                  element={<Login />}
                />
                <Route
                  path={ROUTES.REGISTER}
                  element={<Register />}
                />
                <Route
                  path={ROUTES.FORGOT_PASSWORD}
                  element={<ForgotPassword />}
                />
                <Route
                  path={ROUTES.VERIFY_EMAIL}
                  element={<VerifyEmail />}
                />
                <Route
                  path={ROUTES.VERIFY_EMAIL_REQUIRED}
                  element={<Navigate to={ROUTES.VERIFY_EMAIL} replace />}
                />

                {/* Information Pages */}
                <Route
                  path={ROUTES.CONTACT}
                  element={
                    <MainLayout>
                      <ContactUs />
                    </MainLayout>
                  }
                />
                <Route
                  path={ROUTES.FAQ}
                  element={
                    <MainLayout>
                      <FAQ />
                    </MainLayout>
                  }
                />
                <Route
                  path={ROUTES.SHIPPING}
                  element={
                    <MainLayout>
                      <ShippingInfo />
                    </MainLayout>
                  }
                />
                <Route
                  path={ROUTES.RETURNS}
                  element={
                    <MainLayout>
                      <Returns />
                    </MainLayout>
                  }
                />
                <Route
                  path={ROUTES.PRIVACY}
                  element={
                    <MainLayout>
                      <PrivacyPolicy />
                    </MainLayout>
                  }
                />
                <Route
                  path={ROUTES.TERMS}
                  element={
                    <MainLayout>
                      <TermsOfService />
                    </MainLayout>
                  }
                />
                <Route
                  path={ROUTES.COOKIES}
                  element={
                    <MainLayout>
                      <CookiePolicy />
                    </MainLayout>
                  }
                />

                {/* Protected Routes */}
                <Route
                  path={ROUTES.CART}
                  element={
                    <MainLayout>
                      <ProtectedRoute>
                        <Cart />
                      </ProtectedRoute>
                    </MainLayout>
                  }
                />
                <Route
                  path={ROUTES.CHECKOUT}
                  element={
                    <MainLayout>
                      <ProtectedRoute>
                        <Checkout />
                      </ProtectedRoute>
                    </MainLayout>
                  }
                />
                <Route
                  path={ROUTES.PROFILE}
                  element={
                    <MainLayout>
                      <ProtectedRoute>
                        <Profile />
                      </ProtectedRoute>
                    </MainLayout>
                  }
                />
                <Route
                  path={ROUTES.ORDERS}
                  element={
                    <MainLayout>
                      <ProtectedRoute>
                        <Orders />
                      </ProtectedRoute>
                    </MainLayout>
                  }
                />
                <Route
                  path={ROUTES.ORDER_DETAILS}
                  element={
                    <MainLayout>
                      <ProtectedRoute>
                        <OrderDetails />
                      </ProtectedRoute>
                    </MainLayout>
                  }
                />

                {/* Admin Routes */}
                <Route
                  path={ROUTES.ADMIN_DASHBOARD}
                  element={
                    <AdminLayout>
                      <AdminDashboard />
                    </AdminLayout>
                  }
                />
                <Route
                  path={ROUTES.ADMIN_PRODUCTS}
                  element={
                    <AdminLayout>
                      <AdminProducts />
                    </AdminLayout>
                  }
                />
                <Route
                  path={ROUTES.ADMIN_PRODUCTS_ADD}
                  element={
                    <AdminLayout>
                      <AdminAddProduct />
                    </AdminLayout>
                  }
                />
                <Route
                  path={ROUTES.ADMIN_PRODUCTS_EDIT}
                  element={
                    <AdminLayout>
                      <AdminEditProduct />
                    </AdminLayout>
                  }
                />
                <Route
                  path={ROUTES.ADMIN_CATEGORIES}
                  element={
                    <AdminLayout>
                      <AdminCategories />
                    </AdminLayout>
                  }
                />
                <Route
                  path={ROUTES.ADMIN_ORDERS}
                  element={
                    <AdminLayout>
                      <AdminOrders />
                    </AdminLayout>
                  }
                />
                <Route
                  path={ROUTES.ADMIN_ORDERS_DETAILS}
                  element={
                    <AdminLayout>
                      <AdminOrders />
                    </AdminLayout>
                  }
                />
                <Route
                  path={ROUTES.ADMIN_USERS}
                  element={
                    <AdminLayout>
                      <AdminUsers />
                    </AdminLayout>
                  }
                />
                <Route
                  path={ROUTES.ADMIN_INVENTORY}
                  element={
                    <AdminLayout>
                      <AdminInventory />
                    </AdminLayout>
                  }
                />

                {/* Default redirect */}
                <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
              </Routes>
            </Suspense>
          </VerificationRequiredGate>
        </Router>
      </Provider>
    </ErrorBoundary>
  );
}

export default App;
