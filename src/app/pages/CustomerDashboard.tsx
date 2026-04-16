import { Link } from "react-router";
import { Package, Clock, Eye, ShoppingBag, Heart, TrendingUp } from "lucide-react";

export default function CustomerDashboard() {
  const stats = {
    totalOrders: 8,
    activePreOrders: 2,
    savedPrescriptions: 3,
    wishlistItems: 12,
  };

  const recentOrders = [
    {
      id: "ORD-12345",
      date: "13/04/2026",
      total: 158,
      status: "Đang giao",
      image: "https://images.unsplash.com/photo-1626104853817-343b24b5613f?w=80",
    },
    {
      id: "ORD-12344",
      date: "10/04/2026",
      total: 89,
      status: "Đã giao",
      image: "https://images.unsplash.com/photo-1654274285614-37cad6007665?w=80",
    },
  ];

  const activePreOrders = [
    {
      id: "PRE-001",
      createdAt: "12/04/2026",
      status: "Đang tìm kiếm",
      shapes: ["Chữ nhật", "Vuông"],
    },
    {
      id: "PRE-002",
      createdAt: "08/04/2026",
      status: "Đã tìm thấy",
      shapes: ["Tròn"],
      matchedCount: 3,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="mb-2">Dashboard Khách Hàng</h1>
        <p className="text-muted-foreground">Chào mừng trở lại! Đây là tổng quan tài khoản của bạn</p>
      </div>

      <div className="grid md:grid-cols-4 gap-6 mb-12">
        <Link
          to="/profile"
          className="bg-white border-2 border-border hover:border-primary p-6 rounded-xl transition-all group"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
              <Package className="w-6 h-6 text-primary" />
            </div>
          </div>
          <p className="text-3xl mb-1">{stats.totalOrders}</p>
          <p className="text-sm text-muted-foreground">Tổng đơn hàng</p>
        </Link>

        <Link
          to="/profile/pre-orders"
          className="bg-white border-2 border-border hover:border-primary p-6 rounded-xl transition-all group"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <p className="text-3xl mb-1">{stats.activePreOrders}</p>
          <p className="text-sm text-muted-foreground">Pre-orders đang chờ</p>
        </Link>

        <Link
          to="/profile"
          className="bg-white border-2 border-border hover:border-primary p-6 rounded-xl transition-all group"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
              <Eye className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <p className="text-3xl mb-1">{stats.savedPrescriptions}</p>
          <p className="text-sm text-muted-foreground">Đơn kính đã lưu</p>
        </Link>

        <div className="bg-white border-2 border-border p-6 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-red-100 rounded-lg">
              <Heart className="w-6 h-6 text-red-600" />
            </div>
          </div>
          <p className="text-3xl mb-1">{stats.wishlistItems}</p>
          <p className="text-sm text-muted-foreground">Sản phẩm yêu thích</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2>Đơn hàng gần đây</h2>
            <Link to="/profile" className="text-sm text-primary hover:underline">
              Xem tất cả →
            </Link>
          </div>
          <div className="space-y-4">
            {recentOrders.map((order) => (
              <Link
                key={order.id}
                to={`/orders/${order.id}`}
                className="flex items-center gap-4 p-4 bg-secondary hover:bg-muted rounded-lg transition-colors"
              >
                <img
                  src={order.image}
                  alt="Order"
                  className="w-16 h-16 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <p className="mb-1 text-sm">#{order.id}</p>
                  <p className="text-xs text-muted-foreground">{order.date}</p>
                </div>
                <div className="text-right">
                  <p className="mb-1 text-sm">${order.total}</p>
                  <span
                    className={`inline-block px-2 py-1 text-xs rounded-full ${
                      order.status === "Đã giao"
                        ? "bg-green-100 text-green-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {order.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="bg-white border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2>Pre-orders hoạt động</h2>
            <Link to="/profile/pre-orders" className="text-sm text-primary hover:underline">
              Xem tất cả →
            </Link>
          </div>
          <div className="space-y-4">
            {activePreOrders.map((preOrder) => (
              <Link
                key={preOrder.id}
                to="/profile/pre-orders"
                className="block p-4 bg-secondary hover:bg-muted rounded-lg transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="mb-1 text-sm">#{preOrder.id}</p>
                    <p className="text-xs text-muted-foreground">{preOrder.createdAt}</p>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      preOrder.status === "Đã tìm thấy"
                        ? "bg-green-100 text-green-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {preOrder.status}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {preOrder.shapes.map((shape) => (
                    <span
                      key={shape}
                      className="text-xs px-2 py-1 bg-primary/10 text-primary rounded"
                    >
                      {shape}
                    </span>
                  ))}
                </div>
                {preOrder.matchedCount && (
                  <p className="text-xs text-green-600 mt-2">
                    {preOrder.matchedCount} sản phẩm phù hợp
                  </p>
                )}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Link
          to="/shop/eyeglasses"
          className="bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/20 hover:border-primary p-6 rounded-xl transition-all group"
        >
          <ShoppingBag className="w-8 h-8 text-primary mb-4 group-hover:scale-110 transition-transform" />
          <h3 className="mb-2">Mua sắm ngay</h3>
          <p className="text-sm text-muted-foreground">
            Khám phá bộ sưu tập kính mới nhất
          </p>
        </Link>

        <Link
          to="/pre-order"
          className="bg-gradient-to-br from-blue-50 to-blue-25 border-2 border-blue-200 hover:border-blue-400 p-6 rounded-xl transition-all group"
        >
          <Clock className="w-8 h-8 text-blue-600 mb-4 group-hover:scale-110 transition-transform" />
          <h3 className="mb-2">Tạo Pre-order</h3>
          <p className="text-sm text-muted-foreground">
            Đặt kính theo yêu cầu riêng của bạn
          </p>
        </Link>

        <Link
          to="/shop/premium"
          className="bg-gradient-to-br from-purple-50 to-purple-25 border-2 border-purple-200 hover:border-purple-400 p-6 rounded-xl transition-all group"
        >
          <TrendingUp className="w-8 h-8 text-purple-600 mb-4 group-hover:scale-110 transition-transform" />
          <h3 className="mb-2">Thương hiệu cao cấp</h3>
          <p className="text-sm text-muted-foreground">
            Khám phá các thương hiệu designer
          </p>
        </Link>
      </div>
    </div>
  );
}
