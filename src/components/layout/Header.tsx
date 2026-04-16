import { Link, useNavigate } from "react-router";
import { Search, ShoppingBag, User, HelpCircle, Heart, Menu, LogOut, Package, Settings, UserCircle, LayoutDashboard } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/store/cart/CartContext";
import { useCartDrawer } from "@/store/cart/CartDrawerContext";
import { useAuth } from "@/store/auth/AuthContext";
import CartDrawer from "@/components/layout/CartDrawer";
import Logo from "@/components/layout/Logo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/common/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/common/ui/avatar";

export default function Header() {
  const navigate = useNavigate();
  const { items } = useCart();
  const { isOpen, openDrawer, closeDrawer } = useCartDrawer();
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${searchQuery}`);
    }
  };

  const categories = [
    { name: "Kính Cận", path: "/shop/eyeglasses" },
    { name: "Kính Râm", path: "/shop/sunglasses" },
    { name: "Gọng Kính", path: "/shop/ai-glasses" },
    { name: "Thương Hiệu Cao Cấp", path: "/shop/premium" },
    { name: "Tròng Kính", path: "/shop/lenses" },
  ];

  // Get initials from name or email
  const getUserInitials = () => {
    if (!user) return "U";
    if (user.fullName) {
      return user.fullName.charAt(0).toUpperCase();
    }
    return user.email.charAt(0).toUpperCase();
  };

  // Get display name
  const getDisplayName = () => {
    if (!user) return "Tài khoản";
    return user.fullName || user.email.split("@")[0];
  };

  // Get dashboard link based on role
  const getDashboardLink = () => {
    if (!user) return "/";
    if (user.role === 'admin') return "/admin/dashboard";
    if (user.role === 'staff') return "/staff/dashboard";
    return "/customer/dashboard";
  };

  return (
    <header className="sticky top-0 bg-white border-b border-border z-50">
      <div className="max-w-[1400px] mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          <Logo className="shrink-0" />

          <nav className="hidden lg:flex items-center gap-8 mx-12">
            {categories.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className="text-sm text-foreground hover:text-primary transition-colors"
              >
                {link.name}
              </Link>
            ))}
          </nav>

          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xs mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Tìm kiếm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 text-sm bg-secondary rounded-full border border-transparent focus:border-border focus:outline-none transition-colors"
              />
            </div>
          </form>

          <div className="flex items-center gap-6">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="hidden md:flex items-center gap-2 hover:opacity-80 transition-opacity focus:outline-none">
                    <Avatar className="w-8 h-8 bg-primary text-white">
                      <AvatarFallback className="bg-primary text-white font-semibold">
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{getDisplayName()}</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span className="font-semibold">{getDisplayName()}</span>
                      <span className="text-xs text-muted-foreground font-normal">{user.email}</span>
                      <span className="text-xs text-primary font-normal capitalize mt-1">
                        {user.role === 'admin' && '👑 Admin'}
                        {user.role === 'staff' && '⚙️ Staff'}
                        {user.role === 'customer' && '👤 Khách hàng'}
                      </span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate(getDashboardLink())} className="cursor-pointer">
                    <LayoutDashboard className="w-4 h-4 mr-2" />
                    Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/profile")} className="cursor-pointer">
                    <UserCircle className="w-4 h-4 mr-2" />
                    Hồ sơ cá nhân
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/orders")} className="cursor-pointer">
                    <Package className="w-4 h-4 mr-2" />
                    Đơn hàng của tôi
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/settings")} className="cursor-pointer">
                    <Settings className="w-4 h-4 mr-2" />
                    Cài đặt
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 focus:text-red-600">
                    <LogOut className="w-4 h-4 mr-2" />
                    Đăng xuất
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link
                to="/login"
                className="hidden md:flex items-center gap-1 text-sm text-foreground hover:text-primary transition-colors"
              >
                <User className="w-4 h-4" />
                <span>Đăng nhập</span>
              </Link>
            )}
            <button className="hidden md:block text-foreground hover:text-primary transition-colors">
              <HelpCircle className="w-5 h-5" />
            </button>
            <button className="hidden md:block text-foreground hover:text-primary transition-colors">
              <Heart className="w-5 h-5" />
            </button>
            <button
              onClick={openDrawer}
              className="text-foreground hover:text-primary transition-colors relative"
            >
              <ShoppingBag className="w-5 h-5" />
              {items.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-primary text-white text-xs w-4 h-4 rounded-full flex items-center justify-center" style={{ fontSize: '10px' }}>
                  {items.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden text-foreground"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <nav className="lg:hidden py-4 space-y-2 border-t border-border">
            {categories.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-2 text-sm hover:bg-secondary transition-colors"
              >
                {link.name}
              </Link>
            ))}
          </nav>
        )}
      </div>

      {/* Cart Drawer */}
      <CartDrawer open={isOpen} onOpenChange={(open) => open ? openDrawer() : closeDrawer()} />
    </header>
  );
}