import { createBrowserRouter } from "react-router";
import Layout from "./components/Layout";
import DashboardLayout from "./components/DashboardLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import HomePage from "./pages/HomePage";
import ProductListingPage from "./pages/ProductListingPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import PrescriptionFlow from "./pages/PrescriptionFlow";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import OrderTrackingPage from "./pages/OrderTrackingPage";
import ProfilePage from "./pages/ProfilePage";
import StaffDashboard from "./pages/StaffDashboard";
import LoginPage from "./pages/LoginPage";
import NotFoundPage from "./pages/NotFoundPage";
import PreOrderPage from "./pages/PreOrderPage";
import MyPreOrdersPage from "./pages/MyPreOrdersPage";
import ManagerInventoryPage from "./pages/ManagerInventoryPage";
import ManagerOrdersPage from "./pages/ManagerOrdersPage";
import ManagerReviewsPage from "./pages/ManagerReviewsPage";
import StaffPrescriptionReviewPage from "./pages/StaffPrescriptionReviewPage";
import AdminUsersPage from "./pages/AdminUsersPage";
import InvoicePage from "./pages/InvoicePage";
import CustomerDashboard from "./pages/CustomerDashboard";
import ManagerDashboard from "./pages/ManagerDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import SettingsPage from "./pages/SettingsPage";
import OrdersPage from "./pages/OrdersPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: HomePage },
      { path: "login", Component: LoginPage },
      { path: "shop/:category?", Component: ProductListingPage },
      { path: "product/:id", Component: ProductDetailPage },
      { path: "prescription/:productId", Component: PrescriptionFlow },
      { path: "cart", Component: CartPage },
      { path: "checkout", Component: CheckoutPage },
      { path: "orders/:orderId", Component: OrderTrackingPage },
      {
        path: "profile",
        element: (
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        ),
      },
      {
        path: "profile/pre-orders",
        element: (
          <ProtectedRoute>
            <MyPreOrdersPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "pre-order",
        element: (
          <ProtectedRoute>
            <PreOrderPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "preorder/:productId",
        element: (
          <ProtectedRoute>
            <PreOrderPage />
          </ProtectedRoute>
        ),
      },
      { path: "invoice/:orderId", Component: InvoicePage },
      {
        path: "customer/dashboard",
        element: (
          <ProtectedRoute>
            <CustomerDashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: "manager/dashboard",
        element: (
          <ProtectedRoute>
            <ManagerDashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: "manager/inventory",
        element: (
          <ProtectedRoute>
            <ManagerInventoryPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "manager/orders",
        element: (
          <ProtectedRoute>
            <ManagerOrdersPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "manager/reviews",
        element: (
          <ProtectedRoute>
            <ManagerReviewsPage />
          </ProtectedRoute>
        ),
      },
      { path: "settings", Component: SettingsPage },
      { path: "orders", Component: OrdersPage },
      { path: "*", Component: NotFoundPage },
    ],
  },
  // Admin Routes with DashboardLayout
  {
    path: "/admin",
    element: (
      <ProtectedRoute allowedRoles={['admin']}>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      { path: "dashboard", Component: AdminDashboard },
      { path: "users", Component: AdminUsersPage },
      { path: "orders", Component: ManagerOrdersPage },
      { path: "products", Component: ManagerInventoryPage },
      { path: "inventory", Component: ManagerInventoryPage },
      { path: "lens-packages", Component: SettingsPage },
      { path: "reports", Component: SettingsPage },
      { path: "settings", Component: SettingsPage },
    ],
  },
  // Staff Routes with DashboardLayout
  {
    path: "/staff",
    element: (
      <ProtectedRoute allowedRoles={['staff', 'admin']}>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      { path: "dashboard", Component: StaffDashboard },
      { path: "prescriptions", Component: StaffPrescriptionReviewPage },
      { path: "orders", Component: ManagerOrdersPage },
      { path: "reports", Component: SettingsPage },
    ],
  },
]);