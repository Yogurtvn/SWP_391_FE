import { useMemo, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router";
import {
  BarChart3,
  Bell,
  ChevronDown,
  ClipboardCheck,
  Clock3,
  Eye,
  FileText,
  LayoutDashboard,
  Layers,
  LogOut,
  Menu,
  Package,
  Search,
  Settings,
  ShoppingCart,
  Users,
  X,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/common/ui/avatar";
import { useAuth } from "@/store/auth/AuthContext";

function normalizePath(path) {
  return String(path || "").replace(/\/+$/, "");
}

function pathIsActive(currentPath, targetPath) {
  const current = normalizePath(currentPath);
  const target = normalizePath(targetPath);
  return current === target || current.startsWith(`${target}/`);
}

function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState({
    "/admin/products": true,
  });

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const navigationItems = useMemo(() => {
    if (user?.role === "admin") {
      return [
        { name: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
        { name: "Quản Lý Đơn Hàng", path: "/admin/orders", icon: ShoppingCart },
        {
          name: "Quản Lý Sản Phẩm",
          path: "/admin/products",
          icon: Package,
          children: [
            { name: "Danh sách sản phẩm", path: "/admin/products" },
            { name: "Biến thể pre-order", path: "/admin/products/pre-orders" },
          ],
        },
        { name: "Quản Lý Kho", path: "/admin/inventory", icon: ClipboardCheck },
        { name: "Gói Tròng Kính", path: "/admin/lens-packages", icon: Layers },
        { name: "Quản lý người dùng", path: "/admin/users", icon: Users },
        { name: "Báo Cáo", path: "/admin/reports", icon: BarChart3 },
        { name: "Cài Đặt", path: "/admin/settings", icon: Settings },
      ];
    }

    if (user?.role === "staff") {
      return [
        { name: "Dashboard", path: "/staff/dashboard", icon: LayoutDashboard },
        { name: "Kiểm tra toa kính", path: "/staff/prescriptions", icon: Eye },
        { name: "Đơn Hàng", path: "/staff/orders", icon: ShoppingCart },
        { name: "Kho & Nhập Hàng", path: "/staff/inventory", icon: ClipboardCheck },
        { name: "Báo Cáo Công Việc", path: "/staff/reports", icon: FileText },
      ];
    }

    return [];
  }, [user?.role]);

  const getUserInitials = () => {
    if (!user) return "U";
    if (user.fullName) return user.fullName.charAt(0).toUpperCase();
    return user.email?.charAt(0).toUpperCase() || "U";
  };

  const getDisplayName = () => {
    if (!user) return "User";
    return user.fullName || user.email?.split("@")[0] || "User";
  };

  const roleBadge = useMemo(() => {
    if (user?.role === "admin") return { label: "Quản trị viên", color: "bg-red-100 text-red-700" };
    if (user?.role === "staff") return { label: "Nhân viên", color: "bg-blue-100 text-blue-700" };
    return { label: "Người dùng", color: "bg-gray-100 text-gray-700" };
  }, [user?.role]);

  function itemIsActive(item) {
    if (Array.isArray(item.children) && item.children.length > 0) {
      return item.children.some((child) => pathIsActive(location.pathname, child.path)) || pathIsActive(location.pathname, item.path);
    }

    return pathIsActive(location.pathname, item.path);
  }

  function groupIsExpanded(item) {
    const defaultOpen = itemIsActive(item);
    return expandedGroups[item.path] ?? defaultOpen;
  }

  function toggleGroup(path) {
    setExpandedGroups((current) => ({
      ...current,
      [path]: !(current[path] ?? true),
    }));
  }

  function renderDesktopNavItem(item) {
    const Icon = item.icon;
    const isActive = itemIsActive(item);
    const hasChildren = Array.isArray(item.children) && item.children.length > 0;
    const expanded = hasChildren ? groupIsExpanded(item) : false;

    if (!hasChildren || !sidebarOpen) {
      return (
        <Link
          key={item.path}
          to={item.path}
          className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors ${
            isActive ? "bg-primary text-white" : "text-gray-700 hover:bg-gray-100"
          } ${!sidebarOpen ? "justify-center" : ""}`}
          title={!sidebarOpen ? item.name : ""}
        >
          <Icon className="h-5 w-5 flex-shrink-0" />
          {sidebarOpen ? <span className="text-sm font-medium">{item.name}</span> : null}
        </Link>
      );
    }

    return (
      <div key={item.path} className="space-y-1">
        <button
          type="button"
          onClick={() => toggleGroup(item.path)}
          className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
            isActive ? "bg-primary text-white" : "text-gray-700 hover:bg-gray-100"
          }`}
        >
          <Icon className="h-5 w-5 flex-shrink-0" />
          <span className="flex-1 text-sm font-medium">{item.name}</span>
          <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : "rotate-0"}`} />
        </button>

        {expanded ? (
          <div className="ml-6 space-y-1 border-l border-gray-200 pl-3">
            {item.children.map((child) => {
              const childActive = pathIsActive(location.pathname, child.path);
              const ChildIcon = child.icon || Clock3;

              return (
                <Link
                  key={child.path}
                  to={child.path}
                  className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                    childActive ? "bg-orange-100 font-semibold text-[#11284b]" : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <ChildIcon className="h-4 w-4" />
                  <span>{child.name}</span>
                </Link>
              );
            })}
          </div>
        ) : null}
      </div>
    );
  }

  function renderMobileNavItem(item) {
    const Icon = item.icon;
    const isActive = itemIsActive(item);
    const hasChildren = Array.isArray(item.children) && item.children.length > 0;
    const expanded = hasChildren ? groupIsExpanded(item) : false;

    if (!hasChildren) {
      return (
        <Link
          key={item.path}
          to={item.path}
          onClick={() => setMobileMenuOpen(false)}
          className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors ${
            isActive ? "bg-primary text-white" : "text-gray-700 hover:bg-gray-100"
          }`}
        >
          <Icon className="h-5 w-5" />
          <span className="text-sm font-medium">{item.name}</span>
        </Link>
      );
    }

    return (
      <div key={item.path} className="space-y-1">
        <button
          type="button"
          onClick={() => toggleGroup(item.path)}
          className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
            isActive ? "bg-primary text-white" : "text-gray-700 hover:bg-gray-100"
          }`}
        >
          <Icon className="h-5 w-5" />
          <span className="flex-1 text-sm font-medium">{item.name}</span>
          <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : "rotate-0"}`} />
        </button>

        {expanded ? (
          <div className="ml-6 space-y-1 border-l border-gray-200 pl-3">
            {item.children.map((child) => {
              const childActive = pathIsActive(location.pathname, child.path);
              const ChildIcon = child.icon || Clock3;

              return (
                <Link
                  key={child.path}
                  to={child.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                    childActive ? "bg-orange-100 font-semibold text-[#11284b]" : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <ChildIcon className="h-4 w-4" />
                  <span>{child.name}</span>
                </Link>
              );
            })}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className={`fixed inset-y-0 left-0 z-50 hidden border-r border-gray-200 bg-white transition-all duration-300 lg:block ${sidebarOpen ? "w-64" : "w-20"}`}>
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4">
            {sidebarOpen ? (
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                  <Eye className="h-5 w-5 text-white" />
                </div>
                <span className="text-lg font-bold">EyeWear</span>
              </div>
            ) : (
              <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Eye className="h-5 w-5 text-white" />
              </div>
            )}

            <button
              type="button"
              onClick={() => setSidebarOpen((current) => !current)}
              className="rounded-lg p-1.5 transition-colors hover:bg-gray-100"
            >
              <ChevronDown className={`h-4 w-4 transition-transform ${sidebarOpen ? "rotate-0" : "rotate-180"}`} />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto px-3 py-4">
            <div className="space-y-1">{navigationItems.map(renderDesktopNavItem)}</div>
          </nav>

          <div className="border-t border-gray-200 p-4">
            <div className={`flex items-center gap-3 ${!sidebarOpen ? "justify-center" : ""}`}>
              <Avatar className="h-10 w-10 flex-shrink-0 bg-primary text-white">
                <AvatarFallback className="bg-primary font-semibold text-white">{getUserInitials()}</AvatarFallback>
              </Avatar>
              {sidebarOpen ? (
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{getDisplayName()}</p>
                  <p className={`inline-block rounded-full px-2 py-0.5 text-xs ${roleBadge.color}`}>{roleBadge.label}</p>
                </div>
              ) : null}
            </div>

            {sidebarOpen ? (
              <button
                type="button"
                onClick={handleLogout}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 transition-colors hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
                <span>Đăng xuất</span>
              </button>
            ) : null}
          </div>
        </div>
      </aside>

      {mobileMenuOpen ? (
        <>
          <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setMobileMenuOpen(false)} />
          <aside className="fixed inset-y-0 left-0 z-50 w-64 border-r border-gray-200 bg-white lg:hidden">
            <div className="flex h-full flex-col">
              <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                    <Eye className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-lg font-bold">EyeWear</span>
                </div>
                <button type="button" onClick={() => setMobileMenuOpen(false)} className="rounded-lg p-1.5 hover:bg-gray-100">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <nav className="flex-1 overflow-y-auto px-3 py-4">
                <div className="space-y-1">{navigationItems.map(renderMobileNavItem)}</div>
              </nav>

              <div className="border-t border-gray-200 p-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 bg-primary text-white">
                    <AvatarFallback className="bg-primary font-semibold text-white">{getUserInitials()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{getDisplayName()}</p>
                    <p className={`inline-block rounded-full px-2 py-0.5 text-xs ${roleBadge.color}`}>{roleBadge.label}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 transition-colors hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Đăng xuất</span>
                </button>
              </div>
            </div>
          </aside>
        </>
      ) : null}

      <div className={`flex flex-1 flex-col transition-all duration-300 ${sidebarOpen ? "lg:ml-64" : "lg:ml-20"}`}>
        <header className="sticky top-0 z-30 h-16 border-b border-gray-200 bg-white">
          <div className="flex h-full items-center justify-between px-4 lg:px-6">
            <button type="button" onClick={() => setMobileMenuOpen(true)} className="rounded-lg p-2 hover:bg-gray-100 lg:hidden">
              <Menu className="h-5 w-5" />
            </button>

            <div className="hidden max-w-md flex-1 md:flex">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm..."
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-10 pr-4 text-sm focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button type="button" className="relative rounded-lg p-2 transition-colors hover:bg-gray-100">
                <Bell className="h-5 w-5 text-gray-600" />
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
              </button>

              <button type="button" onClick={() => navigate("/")} className="hidden text-sm text-gray-600 hover:text-primary md:block">
                Về trang chủ →
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>

        <footer className="border-t border-gray-200 bg-white px-6 py-4">
          <div className="flex flex-col items-center justify-between gap-2 text-sm text-gray-600 md:flex-row">
            <p>© 2024 EyeWear. All rights reserved.</p>
            <p>
              Made with care for optical business | <span className={`rounded px-2 py-1 ${roleBadge.color}`}>Bảng {roleBadge.label}</span>
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default DashboardLayout;
