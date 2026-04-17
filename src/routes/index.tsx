import { createBrowserRouter } from "react-router";
import Layout from "@/layouts/Layout";
import DashboardLayout from "@/layouts/DashboardLayout";
import ProtectedRoute from "@/components/common/ProtectedRoute";
import HomePage from "@/pages/customer/HomePage";
import ProductListingPage from "@/pages/customer/ProductListingPage";
import ProductDetailPage from "@/pages/customer/ProductDetailPage";
import PrescriptionFlow from "@/pages/customer/PrescriptionFlow";
import CartPage from "@/pages/customer/CartPage";
import CheckoutPage from "@/pages/customer/CheckoutPage";
import OrderTrackingPage from "@/pages/customer/OrderTrackingPage";
import ProfilePage from "@/pages/customer/ProfilePage";
import StaffDashboard from "@/pages/staff/StaffDashboard";
import LoginPage from "@/pages/customer/LoginPage";
import RegisterPage from "@/pages/customer/RegisterPage";
import NotFoundPage from "@/pages/shared/NotFoundPage";
import PreOrderPage from "@/pages/customer/PreOrderPage";
import MyPreOrdersPage from "@/pages/customer/MyPreOrdersPage";
import ManagerInventoryPage from "@/pages/manager/ManagerInventoryPage";
import ManagerOrdersPage from "@/pages/manager/ManagerOrdersPage";
import ManagerReviewsPage from "@/pages/manager/ManagerReviewsPage";
import StaffPrescriptionReviewPage from "@/pages/staff/StaffPrescriptionReviewPage";
import AdminUsersPage from "@/pages/admin/AdminUsersPage";
import InvoicePage from "@/pages/customer/InvoicePage";
import CustomerDashboard from "@/pages/customer/CustomerDashboard";
import ManagerDashboard from "@/pages/manager/ManagerDashboard";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import SettingsPage from "@/pages/customer/SettingsPage";
import OrdersPage from "@/pages/customer/OrdersPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: HomePage },
      { path: "login", Component: LoginPage },
      { path: "register", Component: RegisterPage },
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
          <ProtectedRoute allowedRoles={['admin']}>
            <ManagerDashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: "manager/inventory",
        element: (
          <ProtectedRoute allowedRoles={['admin']}>
            <ManagerInventoryPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "manager/orders",
        element: (
          <ProtectedRoute allowedRoles={['admin']}>
            <ManagerOrdersPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "manager/reviews",
        element: (
          <ProtectedRoute allowedRoles={['admin']}>
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
