import { useState } from "react";
import { useNavigate } from "react-router";
import {
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye
} from "lucide-react";
function AdminDashboard() {
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState("7days");
  const stats = {
    revenue: {
      current: 52375e4,
      change: 12.5,
      trend: "up"
    },
    orders: {
      current: 1247,
      change: 8.3,
      trend: "up"
    },
    customers: {
      current: 856,
      change: 15.2,
      trend: "up"
    },
    products: {
      current: 342,
      change: -2.1,
      trend: "down"
    }
  };
  const orderStats = {
    pending: 23,
    processing: 45,
    completed: 1156,
    cancelled: 23,
    prescriptionOrders: 156,
    preOrders: 89,
    readyOrders: 1002
  };
  const recentOrders = [
    {
      id: "ORD-2024-005",
      customer: "Ho\xE0ng V\u0103n E",
      type: "prescription",
      total: 32e5,
      status: "reviewing",
      date: "16/01/2024",
      time: "15:45",
      timestamp: /* @__PURE__ */ new Date("2024-01-16T15:45:00")
    },
    {
      id: "ORD-2024-004",
      customer: "Ph\u1EA1m Th\u1ECB D",
      type: "ready",
      total: 65e4,
      status: "completed",
      date: "16/01/2024",
      time: "14:20",
      timestamp: /* @__PURE__ */ new Date("2024-01-16T14:20:00")
    },
    {
      id: "ORD-2024-003",
      customer: "L\xEA V\u0103n C",
      type: "pre-order",
      total: 12e5,
      status: "awaiting-stock",
      date: "16/01/2024",
      time: "12:00",
      timestamp: /* @__PURE__ */ new Date("2024-01-16T12:00:00")
    },
    {
      id: "ORD-2024-002",
      customer: "Tr\u1EA7n Th\u1ECB B",
      type: "ready",
      total: 89e4,
      status: "processing",
      date: "15/01/2024",
      time: "13:15",
      timestamp: /* @__PURE__ */ new Date("2024-01-15T13:15:00")
    },
    {
      id: "ORD-2024-001",
      customer: "Nguy\u1EC5n V\u0103n A",
      type: "prescription",
      total: 259e4,
      status: "pending",
      date: "15/01/2024",
      time: "10:30",
      timestamp: /* @__PURE__ */ new Date("2024-01-15T10:30:00")
    }
  ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  const topProducts = [
    { name: "G\u1ECDng Titan Ch\u1EEF Nh\u1EADt", sold: 245, revenue: 98e6 },
    { name: "K\xEDnh R\xE2m Aviator", sold: 189, revenue: 756e5 },
    { name: "K\xEDnh C\u1EADn G\u1ECDng Tr\xF2n", sold: 167, revenue: 668e5 },
    { name: "G\u1ECDng M\u1EAFt M\xE8o Acetate", sold: 143, revenue: 572e5 }
  ];
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND"
    }).format(amount);
  };
  const getOrderTypeLabel = (type) => {
    const labels = {
      ready: "H\xE0ng s\u1EB5n",
      "pre-order": "\u0110\u1EB7t tr\u01B0\u1EDBc",
      prescription: "K\xEDnh thu\u1ED1c"
    };
    return labels[type] || type;
  };
  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: {
        label: "Ch\u1EDD x\u1EED l\xFD",
        color: "bg-yellow-50 text-yellow-700 border-yellow-200",
        icon: Clock
      },
      processing: {
        label: "\u0110ang x\u1EED l\xFD",
        color: "bg-blue-50 text-blue-700 border-blue-200",
        icon: Package
      },
      "awaiting-stock": {
        label: "Ch\u1EDD h\xE0ng",
        color: "bg-orange-50 text-orange-700 border-orange-200",
        icon: AlertCircle
      },
      reviewing: {
        label: "Ki\u1EC3m tra",
        color: "bg-purple-50 text-purple-700 border-purple-200",
        icon: Eye
      },
      completed: {
        label: "Ho\xE0n th\xE0nh",
        color: "bg-green-50 text-green-700 border-green-200",
        icon: CheckCircle
      },
      cancelled: {
        label: "\u0110\xE3 h\u1EE7y",
        color: "bg-red-50 text-red-700 border-red-200",
        icon: XCircle
      }
    };
    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;
    return <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border ${config.color}`}
    >
        <Icon className="w-3.5 h-3.5" />
        {config.label}
      </span>;
  };
  return <div className="min-h-screen bg-gray-50">
      <div className="p-6 space-y-6">
        {
    /* Page Header */
  }
        <div className="bg-white rounded-2xl border-2 border-gray-300 shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl mb-2 font-bold text-gray-900">Dashboard Tổng Quan</h1>
              <p className="text-gray-600 font-medium">
                Chào mừng trở lại! Đây là tổng quan hệ thống của bạn.
              </p>
            </div>
            <select
    value={dateRange}
    onChange={(e) => setDateRange(e.target.value)}
    className="px-4 py-3 bg-white border-2 border-gray-300 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 font-medium"
  >
              <option value="today">Hôm nay</option>
              <option value="7days">7 ngày qua</option>
              <option value="30days">30 ngày qua</option>
              <option value="90days">90 ngày qua</option>
            </select>
          </div>
        </div>

        {
    /* Stats Cards */
  }
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {
    /* Revenue */
  }
          <div className="bg-white rounded-2xl p-6 border-2 border-gray-300 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center border-2 border-green-200">
                <DollarSign className="w-7 h-7 text-green-600" />
              </div>
              <span
    className={`flex items-center gap-1 text-sm font-bold px-2 py-1 rounded-lg ${stats.revenue.trend === "up" ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50"}`}
  >
                {stats.revenue.trend === "up" ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                {stats.revenue.change}%
              </span>
            </div>
            <h3 className="text-sm text-gray-600 mb-2 font-bold">Tổng Doanh Thu</h3>
            <p className="text-2xl mb-2 font-bold text-gray-900">{formatCurrency(stats.revenue.current)}</p>
            <p className="text-xs text-gray-500 font-medium">+{formatCurrency(stats.revenue.current * (stats.revenue.change / 100))} so với kỳ trước</p>
          </div>

          {
    /* Orders */
  }
          <div className="bg-white rounded-2xl p-6 border-2 border-gray-300 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center border-2 border-blue-200">
                <ShoppingCart className="w-7 h-7 text-blue-600" />
              </div>
              <span className="flex items-center gap-1 text-sm font-bold px-2 py-1 rounded-lg text-green-600 bg-green-50">
                <ArrowUpRight className="w-4 h-4" />
                {stats.orders.change}%
              </span>
            </div>
            <h3 className="text-sm text-gray-600 mb-2 font-bold">Tổng Đơn Hàng</h3>
            <p className="text-2xl mb-2 font-bold text-gray-900">{stats.orders.current.toLocaleString()}</p>
            <p className="text-xs text-gray-500 font-medium">+{Math.round(stats.orders.current * (stats.orders.change / 100))} đơn so với kỳ trước</p>
          </div>

          {
    /* Customers */
  }
          <div className="bg-white rounded-2xl p-6 border-2 border-gray-300 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center border-2 border-purple-200">
                <Users className="w-7 h-7 text-purple-600" />
              </div>
              <span className="flex items-center gap-1 text-sm font-bold px-2 py-1 rounded-lg text-green-600 bg-green-50">
                <ArrowUpRight className="w-4 h-4" />
                {stats.customers.change}%
              </span>
            </div>
            <h3 className="text-sm text-gray-600 mb-2 font-bold">Khách Hàng</h3>
            <p className="text-2xl mb-2 font-bold text-gray-900">{stats.customers.current.toLocaleString()}</p>
            <p className="text-xs text-gray-500 font-medium">+{Math.round(stats.customers.current * (stats.customers.change / 100))} khách mới</p>
          </div>

          {
    /* Products */
  }
          <div className="bg-white rounded-2xl p-6 border-2 border-gray-300 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="w-14 h-14 bg-orange-100 rounded-xl flex items-center justify-center border-2 border-orange-200">
                <Package className="w-7 h-7 text-orange-600" />
              </div>
              <span className="flex items-center gap-1 text-sm font-bold px-2 py-1 rounded-lg text-red-600 bg-red-50">
                <ArrowDownRight className="w-4 h-4" />
                {Math.abs(stats.products.change)}%
              </span>
            </div>
            <h3 className="text-sm text-gray-600 mb-2 font-bold">Sản Phẩm</h3>
            <p className="text-2xl mb-2 font-bold text-gray-900">{stats.products.current.toLocaleString()}</p>
            <p className="text-xs text-gray-500 font-medium">Giảm {Math.abs(Math.round(stats.products.current * (stats.products.change / 100)))} sản phẩm</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {
    /* Order Status */
  }
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 border-2 border-gray-300 shadow-sm">
            <h2 className="text-xl mb-6 font-bold text-gray-900">Trạng Thái Đơn Hàng</h2>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-5 bg-yellow-50 rounded-xl border-2 border-yellow-200">
                <div className="flex items-center gap-3 mb-2">
                  <Clock className="w-6 h-6 text-yellow-600" />
                  <span className="text-sm text-gray-700 font-bold">Chờ xử lý</span>
                </div>
                <p className="text-3xl text-yellow-700 font-bold">{orderStats.pending}</p>
              </div>
              <div className="p-5 bg-blue-50 rounded-xl border-2 border-blue-200">
                <div className="flex items-center gap-3 mb-2">
                  <Package className="w-6 h-6 text-blue-600" />
                  <span className="text-sm text-gray-700 font-bold">Đang xử lý</span>
                </div>
                <p className="text-3xl text-blue-700 font-bold">{orderStats.processing}</p>
              </div>
              <div className="p-5 bg-green-50 rounded-xl border-2 border-green-200">
                <div className="flex items-center gap-3 mb-2">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  <span className="text-sm text-gray-700 font-bold">Hoàn thành</span>
                </div>
                <p className="text-3xl text-green-700 font-bold">{orderStats.completed}</p>
              </div>
              <div className="p-5 bg-red-50 rounded-xl border-2 border-red-200">
                <div className="flex items-center gap-3 mb-2">
                  <XCircle className="w-6 h-6 text-red-600" />
                  <span className="text-sm text-gray-700 font-bold">Đã hủy</span>
                </div>
                <p className="text-3xl text-red-700 font-bold">{orderStats.cancelled}</p>
              </div>
            </div>

            <div className="pt-6 border-t-2 border-gray-200">
              <h3 className="text-sm mb-4 font-bold text-gray-900">Phân loại đơn hàng</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 font-medium">Đơn thường</span>
                  <div className="flex items-center gap-3">
                    <div className="w-48 bg-gray-200 rounded-full h-3">
                      <div
    className="bg-blue-500 h-3 rounded-full"
    style={{
      width: `${orderStats.readyOrders / stats.orders.current * 100}%`
    }}
  />
                    </div>
                    <span className="text-sm font-bold w-16 text-right">
                      {orderStats.readyOrders}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 font-medium">Kính thuốc</span>
                  <div className="flex items-center gap-3">
                    <div className="w-48 bg-gray-200 rounded-full h-3">
                      <div
    className="bg-purple-500 h-3 rounded-full"
    style={{
      width: `${orderStats.prescriptionOrders / stats.orders.current * 100}%`
    }}
  />
                    </div>
                    <span className="text-sm font-bold w-16 text-right">
                      {orderStats.prescriptionOrders}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 font-medium">Đặt trước</span>
                  <div className="flex items-center gap-3">
                    <div className="w-48 bg-gray-200 rounded-full h-3">
                      <div
    className="bg-orange-500 h-3 rounded-full"
    style={{
      width: `${orderStats.preOrders / stats.orders.current * 100}%`
    }}
  />
                    </div>
                    <span className="text-sm font-bold w-16 text-right">
                      {orderStats.preOrders}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {
    /* Top Products */
  }
          <div className="bg-white rounded-2xl p-6 border-2 border-gray-300 shadow-sm">
            <h2 className="text-xl mb-6 font-bold text-gray-900">Sản Phẩm Bán Chạy</h2>
            <div className="space-y-3">
              {topProducts.map((product, index) => <div
    key={index}
    className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors border-2 border-gray-200"
  >
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0 border-2 border-primary/20">
                    <span className="text-sm font-bold text-primary">
                      #{index + 1}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate mb-1 text-gray-900">
                      {product.name}
                    </p>
                    <p className="text-xs text-gray-600 font-medium">
                      {product.sold} đã bán
                    </p>
                    <p className="text-sm font-bold text-primary mt-1">
                      {formatCurrency(product.revenue)}
                    </p>
                  </div>
                </div>)}
            </div>
          </div>
        </div>

        {
    /* Recent Orders */
  }
        <div className="bg-white rounded-2xl p-6 border-2 border-gray-300 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Đơn Hàng Gần Đây</h2>
            <button
    onClick={() => navigate("/admin/orders")}
    className="text-sm text-primary hover:underline font-bold"
  >
              Xem tất cả →
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-300">
                  <th className="text-left text-xs font-bold text-gray-700 pb-4">
                    Mã đơn
                  </th>
                  <th className="text-left text-xs font-bold text-gray-700 pb-4">
                    Khách hàng
                  </th>
                  <th className="text-left text-xs font-bold text-gray-700 pb-4">
                    Loại
                  </th>
                  <th className="text-right text-xs font-bold text-gray-700 pb-4">
                    Tổng tiền
                  </th>
                  <th className="text-center text-xs font-bold text-gray-700 pb-4">
                    Trạng thái
                  </th>
                  <th className="text-right text-xs font-bold text-gray-700 pb-4">
                    Thời gian
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-gray-200">
                {recentOrders.map((order) => <tr
    key={order.id}
    className="hover:bg-gray-50 cursor-pointer transition-colors"
    onClick={() => navigate(`/orders/${order.id}`)}
  >
                    <td className="py-4 text-sm font-bold text-gray-900">{order.id}</td>
                    <td className="py-4 text-sm font-medium text-gray-700">{order.customer}</td>
                    <td className="py-4">
                      <span className="text-xs px-3 py-1 bg-gray-100 rounded-full font-bold border-2 border-gray-200">
                        {getOrderTypeLabel(order.type)}
                      </span>
                    </td>
                    <td className="py-4 text-sm text-right font-bold text-primary">
                      {formatCurrency(order.total)}
                    </td>
                    <td className="py-4 text-center">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="py-4 text-sm text-right text-gray-600">
                      <div className="font-medium">{order.date}</div>
                      <div className="text-xs font-medium">{order.time}</div>
                    </td>
                  </tr>)}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>;
}
export {
  AdminDashboard as default
};
