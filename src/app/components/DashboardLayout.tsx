import { useState } from "react";
import { Link, Outlet, useNavigate, useLocation } from "react-router";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Eye,
  BarChart3,
  Settings,
  ClipboardCheck,
  FileText,
  Layers,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Bell,
  Search,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Avatar, AvatarFallback } from "./ui/avatar";

export default function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // Navigation items based on role
  const getNavigationItems = () => {
    if (user?.role === "admin") {
      return [
        {
          name: "Dashboard",
          path: "/admin/dashboard",
          icon: LayoutDashboard,
        },
        {
          name: "Quản Lý Đơn Hàng",
          path: "/admin/orders",
          icon: ShoppingCart,
        },
        {
          name: "Quản Lý Sản Phẩm",
          path: "/admin/products",
          icon: Package,
        },
        {
          name: "Quản Lý Kho",
          path: "/admin/inventory",
          icon: ClipboardCheck,
        },
        {
          name: "Gói Tròng Kính",
          path: "/admin/lens-packages",
          icon: Layers,
        },
        {
          name: "Quản Lý Users",
          path: "/admin/users",
          icon: Users,
        },
        {
          name: "Báo Cáo",
          path: "/admin/reports",
          icon: BarChart3,
        },
        {
          name: "Cài Đặt",
          path: "/admin/settings",
          icon: Settings,
        },
      ];
    } else if (user?.role === "staff") {
      return [
        {
          name: "Dashboard",
          path: "/staff/dashboard",
          icon: LayoutDashboard,
        },
        {
          name: "Kiểm Tra Prescription",
          path: "/staff/prescriptions",
          icon: Eye,
        },
        {
          name: "Đơn Hàng",
          path: "/staff/orders",
          icon: ShoppingCart,
        },
        {
          name: "Báo Cáo Công Việc",
          path: "/staff/reports",
          icon: FileText,
        },
      ];
    }
    return [];
  };

  const navigationItems = getNavigationItems();

  const getUserInitials = () => {
    if (!user) return "U";
    if (user.fullName) {
      return user.fullName.charAt(0).toUpperCase();
    }
    return user.email.charAt(0).toUpperCase();
  };

  const getDisplayName = () => {
    if (!user) return "User";
    return user.fullName || user.email.split("@")[0];
  };

  const getRoleBadge = () => {
    if (user?.role === "admin") return { label: "Admin", color: "bg-red-100 text-red-700" };
    if (user?.role === "staff") return { label: "Staff", color: "bg-blue-100 text-blue-700" };
    return { label: "User", color: "bg-gray-100 text-gray-700" };
  };

  const roleBadge = getRoleBadge();

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 bg-white border-r border-gray-200 transition-all duration-300 ${
          sidebarOpen ? "w-64" : "w-20"
        } hidden lg:block`}
      >
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
            {sidebarOpen ? (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                </div>
                <span className="font-bold text-lg">EyeWear</span>
              </div>
            ) : (
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center mx-auto">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              </div>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronDown
                className={`w-4 h-4 transition-transform ${
                  sidebarOpen ? "rotate-0" : "rotate-180"
                }`}
              />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 overflow-y-auto">
            <div className="space-y-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                      isActive
                        ? "bg-primary text-white"
                        : "text-gray-700 hover:bg-gray-100"
                    } ${!sidebarOpen && "justify-center"}`}
                    title={!sidebarOpen ? item.name : ""}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {sidebarOpen && (
                      <span className="text-sm font-medium">{item.name}</span>
                    )}
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* User Profile */}
          <div className="p-4 border-t border-gray-200">
            <div
              className={`flex items-center gap-3 ${
                !sidebarOpen && "justify-center"
              }`}
            >
              <Avatar className="w-10 h-10 bg-primary text-white flex-shrink-0">
                <AvatarFallback className="bg-primary text-white font-semibold">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              {sidebarOpen && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {getDisplayName()}
                  </p>
                  <p
                    className={`text-xs px-2 py-0.5 rounded-full inline-block ${roleBadge.color}`}
                  >
                    {roleBadge.label}
                  </p>
                </div>
              )}
            </div>
            {sidebarOpen && (
              <button
                onClick={handleLogout}
                className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Đăng xuất</span>
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      {mobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 lg:hidden">
            <div className="h-full flex flex-col">
              {/* Logo */}
              <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  </div>
                  <span className="font-bold text-lg">EyeWear</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation */}
              <nav className="flex-1 px-3 py-4 overflow-y-auto">
                <div className="space-y-1">
                  {navigationItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                          isActive
                            ? "bg-primary text-white"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="text-sm font-medium">{item.name}</span>
                      </Link>
                    );
                  })}
                </div>
              </nav>

              {/* User Profile */}
              <div className="p-4 border-t border-gray-200">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10 bg-primary text-white">
                    <AvatarFallback className="bg-primary text-white font-semibold">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{getDisplayName()}</p>
                    <p
                      className={`text-xs px-2 py-0.5 rounded-full inline-block ${roleBadge.color}`}
                    >
                      {roleBadge.label}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Đăng xuất</span>
                </button>
              </div>
            </div>
          </aside>
        </>
      )}

      {/* Main Content */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${
          sidebarOpen ? "lg:ml-64" : "lg:ml-20"
        }`}
      >
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 sticky top-0 z-30">
          <div className="h-full px-4 lg:px-6 flex items-center justify-between">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Search Bar */}
            <div className="hidden md:flex flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm..."
                  className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-3">
              <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Bell className="w-5 h-5 text-gray-600" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              <button
                onClick={() => navigate("/")}
                className="hidden md:block text-sm text-gray-600 hover:text-primary"
              >
                Về trang chủ →
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 py-4 px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-2 text-sm text-gray-600">
            <p>© 2024 EyeWear. All rights reserved.</p>
            <p>
              Made with ❤️ for optical business |{" "}
              <span className={`px-2 py-1 rounded ${roleBadge.color}`}>
                {roleBadge.label} Panel
              </span>
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}