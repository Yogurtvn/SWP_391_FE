import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import { useSelector } from "react-redux";
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
  Eye,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { selectAuthState } from "@/store/auth/authSlice";
import { getDashboard, getAllOrders } from "@/services/adminService";

// ── Mock data dùng khi chưa có token thật (demo mode) ──────────────────────
const MOCK_DASHBOARD = {
  revenue: { current: 523750000, changePercent: 12.5 },
  totalOrders: { current: 1247, changePercent: 8.3 },
  totalCustomers: { current: 856, changePercent: 15.2 },
  totalProducts: { current: 342 },
  ordersByStatus: { pending: 23, processing: 45, completed: 1156, cancelled: 23 },
  topProducts: [
    { name: "Gọng Titan Chữ Nhật", soldCount: 245, revenue: 98000000 },
    { name: "Kính Râm Aviator", soldCount: 189, revenue: 75600000 },
    { name: "Kính Cận Gọng Tròn", soldCount: 167, revenue: 66800000 },
    { name: "Gọng Mắt Mèo Acetate", soldCount: 143, revenue: 57200000 },
  ],
};
const MOCK_ORDERS = [
  { orderId: 5, customerName: "Hoàng Văn E", totalAmount: 3200000, status: "reviewing", createdAt: "2024-01-16T15:45:00" },
  { orderId: 4, customerName: "Phạm Thị D", totalAmount: 650000, status: "completed", createdAt: "2024-01-16T14:20:00" },
  { orderId: 3, customerName: "Lê Văn C", totalAmount: 1200000, status: "processing", createdAt: "2024-01-16T12:00:00" },
  { orderId: 2, customerName: "Trần Thị B", totalAmount: 890000, status: "pending", createdAt: "2024-01-15T13:15:00" },
  { orderId: 1, customerName: "Nguyễn Văn A", totalAmount: 2590000, status: "pending", createdAt: "2024-01-15T10:30:00" },
];

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────
const formatCurrency = (amount) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount ?? 0);

const DATE_RANGES = {
  today: { label: "Hôm nay", days: 0 },
  "7days": { label: "7 ngày qua", days: 7 },
  "30days": { label: "30 ngày qua", days: 30 },
  "90days": { label: "90 ngày qua", days: 90 },
};

function buildDateRange(rangeKey) {
  const now = new Date();
  const endDate = now.toISOString();
  const { days } = DATE_RANGES[rangeKey] ?? DATE_RANGES["7days"];
  if (days === 0) {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    return { startDate: start.toISOString(), endDate };
  }
  const start = new Date(now);
  start.setDate(now.getDate() - days);
  return { startDate: start.toISOString(), endDate };
}

const getStatusBadge = (status) => {
  const statusConfig = {
    pending: { label: "Chờ xử lý", color: "bg-yellow-50 text-yellow-700 border-yellow-200", icon: Clock },
    processing: { label: "Đang xử lý", color: "bg-blue-50 text-blue-700 border-blue-200", icon: Package },
    "awaiting-stock": { label: "Chờ hàng", color: "bg-orange-50 text-orange-700 border-orange-200", icon: AlertCircle },
    reviewing: { label: "Kiểm tra", color: "bg-purple-50 text-purple-700 border-purple-200", icon: Eye },
    completed: { label: "Hoàn thành", color: "bg-green-50 text-green-700 border-green-200", icon: CheckCircle },
    cancelled: { label: "Đã hủy", color: "bg-red-50 text-red-700 border-red-200", icon: XCircle },
    delivered: { label: "Đã giao", color: "bg-green-50 text-green-700 border-green-200", icon: CheckCircle },
  };
  const config = statusConfig[status] ?? statusConfig.pending;
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border ${config.color}`}>
      <Icon className="w-3.5 h-3.5" />
      {config.label}
    </span>
  );
};

const getOrderTypeLabel = (type) => {
  const labels = { ready: "Hàng sẵn", "pre-order": "Đặt trước", prescription: "Kính thuốc" };
  return labels[type] || type;
};

// ──────────────────────────────────────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const navigate = useNavigate();
  const { accessToken } = useSelector(selectAuthState);

  const [dateRange, setDateRange] = useState("7days");
  const [dashboardData, setDashboardData] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ── Fetch dashboard ──────────────────────────────────────────────────────
  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);

    // Nếu không có token thật (demo account) → dùng mock data
    if (!accessToken) {
      setDashboardData(MOCK_DASHBOARD);
      setRecentOrders(MOCK_ORDERS);
      setLoading(false);
      return;
    }

    try {
      const dateParams = buildDateRange(dateRange);

      // Gọi song song: dashboard summary + 5 đơn hàng gần nhất
      const [dashboard, ordersResult] = await Promise.all([
        getDashboard(dateParams, accessToken),
        getAllOrders({ page: 1, pageSize: 5, sortBy: "createdAt", sortOrder: "desc" }, accessToken),
      ]);

      setDashboardData(dashboard);
      setRecentOrders(ordersResult?.items ?? []);
    } catch (err) {
      setError(err.message || "Không thể tải dữ liệu dashboard.");
    } finally {
      setLoading(false);
    }
  }, [accessToken, dateRange]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // ── Render loading ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-600 font-medium text-lg">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  // ── Render error ─────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl border-2 border-red-200 p-8 max-w-md w-full text-center shadow-sm">
          <AlertCircle className="w-14 h-14 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Không thể tải dashboard</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={fetchDashboard}
            className="px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 font-bold transition-colors"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  // ── Lấy dữ liệu từ response BE ──────────────────────────────────────────
  // BE trả về DashboardResponse: { revenue, totalOrders, totalCustomers, totalProducts,
  //   ordersByStatus: { pending, processing, completed, cancelled, ... },
  //   topProducts: [{ name, soldCount, revenue }] }
  const revenue = dashboardData?.revenue ?? {};
  const totalOrders = dashboardData?.totalOrders ?? {};
  const totalCustomers = dashboardData?.totalCustomers ?? {};
  const totalProducts = dashboardData?.totalProducts ?? {};
  const ordersByStatus = dashboardData?.ordersByStatus ?? {};
  const topProducts = dashboardData?.topProducts ?? [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6 space-y-6">

        {/* Page Header */}
        <div className="bg-white rounded-2xl border-2 border-gray-300 shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl mb-2 font-bold text-gray-900">Dashboard Tổng Quan</h1>
              <p className="text-gray-600 font-medium">
                Chào mừng trở lại! Đây là tổng quan hệ thống của bạn.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={fetchDashboard}
                disabled={loading}
                className="p-2.5 border-2 border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                title="Tải lại"
              >
                <RefreshCw className="w-5 h-5 text-gray-600" />
              </button>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-4 py-3 bg-white border-2 border-gray-300 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 font-medium"
              >
                {Object.entries(DATE_RANGES).map(([key, { label }]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Doanh thu */}
          <div className="bg-white rounded-2xl p-6 border-2 border-gray-300 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center border-2 border-green-200">
                <DollarSign className="w-7 h-7 text-green-600" />
              </div>
              {revenue.changePercent != null && (
                <span className={`flex items-center gap-1 text-sm font-bold px-2 py-1 rounded-lg ${revenue.changePercent >= 0 ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50"}`}>
                  {revenue.changePercent >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                  {Math.abs(revenue.changePercent).toFixed(1)}%
                </span>
              )}
            </div>
            <h3 className="text-sm text-gray-600 mb-2 font-bold">Tổng Doanh Thu</h3>
            <p className="text-2xl mb-2 font-bold text-gray-900">{formatCurrency(revenue.current ?? revenue.total ?? 0)}</p>
            {revenue.changePercent != null && (
              <p className="text-xs text-gray-500 font-medium">
                {revenue.changePercent >= 0 ? "+" : ""}{revenue.changePercent.toFixed(1)}% so với kỳ trước
              </p>
            )}
          </div>

          {/* Đơn hàng */}
          <div className="bg-white rounded-2xl p-6 border-2 border-gray-300 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center border-2 border-blue-200">
                <ShoppingCart className="w-7 h-7 text-blue-600" />
              </div>
              {totalOrders.changePercent != null && (
                <span className={`flex items-center gap-1 text-sm font-bold px-2 py-1 rounded-lg ${totalOrders.changePercent >= 0 ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50"}`}>
                  {totalOrders.changePercent >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                  {Math.abs(totalOrders.changePercent).toFixed(1)}%
                </span>
              )}
            </div>
            <h3 className="text-sm text-gray-600 mb-2 font-bold">Tổng Đơn Hàng</h3>
            <p className="text-2xl mb-2 font-bold text-gray-900">
              {(totalOrders.current ?? totalOrders.total ?? 0).toLocaleString()}
            </p>
          </div>

          {/* Khách hàng */}
          <div className="bg-white rounded-2xl p-6 border-2 border-gray-300 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center border-2 border-purple-200">
                <Users className="w-7 h-7 text-purple-600" />
              </div>
              {totalCustomers.changePercent != null && (
                <span className={`flex items-center gap-1 text-sm font-bold px-2 py-1 rounded-lg ${totalCustomers.changePercent >= 0 ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50"}`}>
                  {totalCustomers.changePercent >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                  {Math.abs(totalCustomers.changePercent).toFixed(1)}%
                </span>
              )}
            </div>
            <h3 className="text-sm text-gray-600 mb-2 font-bold">Khách Hàng</h3>
            <p className="text-2xl mb-2 font-bold text-gray-900">
              {(totalCustomers.current ?? totalCustomers.total ?? 0).toLocaleString()}
            </p>
          </div>

          {/* Sản phẩm */}
          <div className="bg-white rounded-2xl p-6 border-2 border-gray-300 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="w-14 h-14 bg-orange-100 rounded-xl flex items-center justify-center border-2 border-orange-200">
                <Package className="w-7 h-7 text-orange-600" />
              </div>
            </div>
            <h3 className="text-sm text-gray-600 mb-2 font-bold">Sản Phẩm</h3>
            <p className="text-2xl mb-2 font-bold text-gray-900">
              {(totalProducts.current ?? totalProducts.total ?? 0).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Trạng thái đơn hàng */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 border-2 border-gray-300 shadow-sm">
            <h2 className="text-xl mb-6 font-bold text-gray-900">Trạng Thái Đơn Hàng</h2>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-5 bg-yellow-50 rounded-xl border-2 border-yellow-200">
                <div className="flex items-center gap-3 mb-2">
                  <Clock className="w-6 h-6 text-yellow-600" />
                  <span className="text-sm text-gray-700 font-bold">Chờ xử lý</span>
                </div>
                <p className="text-3xl text-yellow-700 font-bold">{ordersByStatus.pending ?? 0}</p>
              </div>
              <div className="p-5 bg-blue-50 rounded-xl border-2 border-blue-200">
                <div className="flex items-center gap-3 mb-2">
                  <Package className="w-6 h-6 text-blue-600" />
                  <span className="text-sm text-gray-700 font-bold">Đang xử lý</span>
                </div>
                <p className="text-3xl text-blue-700 font-bold">{ordersByStatus.processing ?? 0}</p>
              </div>
              <div className="p-5 bg-green-50 rounded-xl border-2 border-green-200">
                <div className="flex items-center gap-3 mb-2">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  <span className="text-sm text-gray-700 font-bold">Hoàn thành</span>
                </div>
                <p className="text-3xl text-green-700 font-bold">{ordersByStatus.completed ?? ordersByStatus.delivered ?? 0}</p>
              </div>
              <div className="p-5 bg-red-50 rounded-xl border-2 border-red-200">
                <div className="flex items-center gap-3 mb-2">
                  <XCircle className="w-6 h-6 text-red-600" />
                  <span className="text-sm text-gray-700 font-bold">Đã hủy</span>
                </div>
                <p className="text-3xl text-red-700 font-bold">{ordersByStatus.cancelled ?? 0}</p>
              </div>
            </div>
          </div>

          {/* Top sản phẩm bán chạy */}
          <div className="bg-white rounded-2xl p-6 border-2 border-gray-300 shadow-sm">
            <h2 className="text-xl mb-6 font-bold text-gray-900">Sản Phẩm Bán Chạy</h2>
            {topProducts.length === 0 ? (
              <p className="text-gray-500 text-center py-8 font-medium">Chưa có dữ liệu</p>
            ) : (
              <div className="space-y-3">
                {topProducts.map((product, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors border-2 border-gray-200"
                  >
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0 border-2 border-primary/20">
                      <span className="text-sm font-bold text-primary">#{index + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate mb-1 text-gray-900">
                        {product.name ?? product.productName ?? "—"}
                      </p>
                      <p className="text-xs text-gray-600 font-medium">
                        {(product.soldCount ?? product.sold ?? 0)} đã bán
                      </p>
                      <p className="text-sm font-bold text-primary mt-1">
                        {formatCurrency(product.revenue ?? 0)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Đơn hàng gần đây */}
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

          {recentOrders.length === 0 ? (
            <div className="text-center py-10 text-gray-500 font-medium">
              <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-30" />
              Chưa có đơn hàng nào
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-300">
                    <th className="text-left text-xs font-bold text-gray-700 pb-4">Mã đơn</th>
                    <th className="text-left text-xs font-bold text-gray-700 pb-4">Khách hàng</th>
                    <th className="text-right text-xs font-bold text-gray-700 pb-4">Tổng tiền</th>
                    <th className="text-center text-xs font-bold text-gray-700 pb-4">Trạng thái</th>
                    <th className="text-right text-xs font-bold text-gray-700 pb-4">Thời gian</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-gray-200">
                  {recentOrders.map((order) => (
                    <tr
                      key={order.orderId ?? order.id}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => navigate(`/admin/orders/${order.orderId ?? order.id}`)}
                    >
                      <td className="py-4 text-sm font-bold text-gray-900">
                        #{order.orderId ?? order.id}
                      </td>
                      <td className="py-4 text-sm font-medium text-gray-700">
                        {order.customerName ?? order.customer ?? "—"}
                      </td>
                      <td className="py-4 text-sm text-right font-bold text-primary">
                        {formatCurrency(order.totalAmount ?? order.total ?? 0)}
                      </td>
                      <td className="py-4 text-center">
                        {getStatusBadge(order.status)}
                      </td>
                      <td className="py-4 text-sm text-right text-gray-600">
                        {order.createdAt
                          ? new Date(order.createdAt).toLocaleDateString("vi-VN", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
