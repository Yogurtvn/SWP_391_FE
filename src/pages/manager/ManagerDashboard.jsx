import { Link } from "react-router";
import {
  Package,
  ShoppingCart,
  Star,
  AlertCircle,
  TrendingUp,
  Clock,
  CheckCircle,
  Archive
} from "lucide-react";
function ManagerDashboard() {
  const stats = {
    pendingOrders: 12,
    lowStock: 5,
    pendingReviews: 8,
    activePreOrders: 6
  };
  const alerts = [
    {
      id: "1",
      type: "warning",
      message: "5 s\u1EA3n ph\u1EA9m s\u1EAFp h\u1EBFt h\xE0ng",
      action: "Xem kho h\xE0ng",
      link: "/manager/inventory"
    },
    {
      id: "2",
      type: "info",
      message: "12 \u0111\u01A1n h\xE0ng \u0111ang ch\u1EDD x\u1EED l\xFD",
      action: "Xem \u0111\u01A1n h\xE0ng",
      link: "/manager/orders"
    },
    {
      id: "3",
      type: "info",
      message: "8 \u0111\xE1nh gi\xE1 ch\u1EDD duy\u1EC7t",
      action: "Duy\u1EC7t \u0111\xE1nh gi\xE1",
      link: "/manager/reviews"
    }
  ];
  const recentActivities = [
    {
      id: "1",
      text: "\u0110\u01A1n h\xE0ng #ORD-12345 \u0111\xE3 \u0111\u01B0\u1EE3c c\u1EADp nh\u1EADt sang tr\u1EA1ng th\xE1i '\u0110ang giao'",
      time: "5 ph\xFAt tr\u01B0\u1EDBc",
      icon: CheckCircle,
      color: "text-green-600"
    },
    {
      id: "2",
      text: "S\u1EA3n ph\u1EA9m 'G\u1ECDng Aviator Classic' t\u1ED3n kho th\u1EA5p (c\xF2n 3)",
      time: "15 ph\xFAt tr\u01B0\u1EDBc",
      icon: AlertCircle,
      color: "text-yellow-600"
    },
    {
      id: "3",
      text: "Pre-order m\u1EDBi t\u1EEB kh\xE1ch h\xE0ng Nguy\u1EC5n V\u0103n A",
      time: "1 gi\u1EDD tr\u01B0\u1EDBc",
      icon: Clock,
      color: "text-blue-600"
    },
    {
      id: "4",
      text: "\u0110\xE1nh gi\xE1 5 sao cho s\u1EA3n ph\u1EA9m 'M\u1EAFt M\xE8o Hi\u1EC7n \u0110\u1EA1i'",
      time: "2 gi\u1EDD tr\u01B0\u1EDBc",
      icon: Star,
      color: "text-primary"
    }
  ];
  return <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="mb-2">Dashboard Quản Lý</h1>
        <p className="text-muted-foreground">
          Tổng quan hoạt động và quản lý cửa hàng
        </p>
      </div>

      <div className="grid md:grid-cols-4 gap-6 mb-12">
        <Link
    to="/manager/orders?status=pending"
    className="bg-white border-2 border-border hover:border-yellow-500 p-6 rounded-xl transition-all group"
  >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-yellow-100 rounded-lg group-hover:bg-yellow-200 transition-colors">
              <ShoppingCart className="w-6 h-6 text-yellow-600" />
            </div>
            {stats.pendingOrders > 0 && <span className="px-2 py-1 bg-yellow-500 text-white text-xs rounded-full">
                Mới
              </span>}
          </div>
          <p className="text-3xl mb-1">{stats.pendingOrders}</p>
          <p className="text-sm text-muted-foreground">Đơn hàng chờ xử lý</p>
        </Link>

        <Link
    to="/manager/inventory?filter=low-stock"
    className="bg-white border-2 border-border hover:border-red-500 p-6 rounded-xl transition-all group"
  >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-red-100 rounded-lg group-hover:bg-red-200 transition-colors">
              <Package className="w-6 h-6 text-red-600" />
            </div>
            {stats.lowStock > 0 && <AlertCircle className="w-5 h-5 text-red-600" />}
          </div>
          <p className="text-3xl mb-1">{stats.lowStock}</p>
          <p className="text-sm text-muted-foreground">Sản phẩm sắp hết</p>
        </Link>

        <Link
    to="/manager/reviews?status=pending"
    className="bg-white border-2 border-border hover:border-blue-500 p-6 rounded-xl transition-all group"
  >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
              <Star className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <p className="text-3xl mb-1">{stats.pendingReviews}</p>
          <p className="text-sm text-muted-foreground">Đánh giá chờ duyệt</p>
        </Link>

        <Link
    to="/manager/orders?type=pre-order"
    className="bg-white border-2 border-border hover:border-primary p-6 rounded-xl transition-all group"
  >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
              <Clock className="w-6 h-6 text-primary" />
            </div>
          </div>
          <p className="text-3xl mb-1">{stats.activePreOrders}</p>
          <p className="text-sm text-muted-foreground">Pre-orders đang xử lý</p>
        </Link>
      </div>

      <div className="grid lg:grid-cols-3 gap-8 mb-8">
        <div className="lg:col-span-2 bg-white border border-border rounded-xl p-6">
          <h2 className="mb-6">Thông báo quan trọng</h2>
          <div className="space-y-4">
            {alerts.map((alert) => <div
    key={alert.id}
    className={`p-4 rounded-lg border-2 ${alert.type === "warning" ? "bg-yellow-50 border-yellow-200" : "bg-blue-50 border-blue-200"}`}
  >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <AlertCircle
    className={`w-5 h-5 shrink-0 mt-0.5 ${alert.type === "warning" ? "text-yellow-600" : "text-blue-600"}`}
  />
                    <p
    className={`text-sm ${alert.type === "warning" ? "text-yellow-900" : "text-blue-900"}`}
  >
                      {alert.message}
                    </p>
                  </div>
                  <Link
    to={alert.link}
    className={`text-sm px-3 py-1 rounded hover:underline ${alert.type === "warning" ? "text-yellow-700 hover:bg-yellow-100" : "text-blue-700 hover:bg-blue-100"}`}
  >
                    {alert.action} →
                  </Link>
                </div>
              </div>)}
          </div>
        </div>

        <div className="bg-white border border-border rounded-xl p-6">
          <h2 className="mb-6">Hoạt động gần đây</h2>
          <div className="space-y-4">
            {recentActivities.map((activity) => <div key={activity.id} className="flex gap-3">
                <div className="shrink-0">
                  <activity.icon className={`w-5 h-5 ${activity.color}`} />
                </div>
                <div className="flex-1">
                  <p className="text-sm mb-1">{activity.text}</p>
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </div>
              </div>)}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Link
    to="/manager/inventory"
    className="bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/20 hover:border-primary p-6 rounded-xl transition-all group"
  >
          <Archive className="w-8 h-8 text-primary mb-4 group-hover:scale-110 transition-transform" />
          <h3 className="mb-2">Quản lý kho hàng</h3>
          <p className="text-sm text-muted-foreground">
            Thêm, sửa, xóa sản phẩm trong kho
          </p>
        </Link>

        <Link
    to="/manager/orders"
    className="bg-gradient-to-br from-blue-50 to-blue-25 border-2 border-blue-200 hover:border-blue-400 p-6 rounded-xl transition-all group"
  >
          <ShoppingCart className="w-8 h-8 text-blue-600 mb-4 group-hover:scale-110 transition-transform" />
          <h3 className="mb-2">Quản lý đơn hàng</h3>
          <p className="text-sm text-muted-foreground">
            Xác nhận và xử lý các đơn hàng
          </p>
        </Link>

        <Link
    to="/manager/reviews"
    className="bg-gradient-to-br from-purple-50 to-purple-25 border-2 border-purple-200 hover:border-purple-400 p-6 rounded-xl transition-all group"
  >
          <Star className="w-8 h-8 text-purple-600 mb-4 group-hover:scale-110 transition-transform" />
          <h3 className="mb-2">Quản lý đánh giá</h3>
          <p className="text-sm text-muted-foreground">
            Duyệt và quản lý đánh giá khách hàng
          </p>
        </Link>
      </div>

      <div className="mt-8 bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 rounded-xl p-6">
        <div className="flex items-center gap-4">
          <TrendingUp className="w-10 h-10 text-primary" />
          <div className="flex-1">
            <h3 className="mb-1">Hiệu suất tốt!</h3>
            <p className="text-sm text-muted-foreground">
              Tỷ lệ xử lý đơn hàng đúng hạn: 95% • Đánh giá trung bình: 4.8/5
            </p>
          </div>
          <Link
    to="/staff"
    className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 transition-colors"
  >
            Xem báo cáo →
          </Link>
        </div>
      </div>
    </div>;
}
export {
  ManagerDashboard as default
};
