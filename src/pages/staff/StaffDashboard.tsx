import { useState } from "react";
import { useNavigate } from "react-router";
import {
  Package,
  Clock,
  CheckCircle,
  Eye,
  AlertCircle,
  Truck,
  Search,
  Filter,
  ArrowRight,
} from "lucide-react";

export default function StaffDashboard() {
  const navigate = useNavigate();
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Mock data
  const stats = {
    pendingOrders: 23,
    processingOrders: 45,
    awaitingStockOrders: 12,
    prescriptionReviewPending: 8,
    todayCompletedOrders: 34,
  };

  const myTasks = {
    total: 76,
    urgent: 15,
    completed: 34,
  };

  const orders = [
    {
      id: "ORD-2024-001",
      customer: "Nguyễn Văn A",
      type: "prescription",
      total: 2590000,
      status: "pending",
      date: "15/01/2024",
      time: "14:30",
      priority: "high",
      prescriptionStatus: "pending-review",
    },
    {
      id: "ORD-2024-002",
      customer: "Trần Thị B",
      type: "ready",
      total: 890000,
      status: "processing",
      date: "15/01/2024",
      time: "13:15",
      priority: "normal",
    },
    {
      id: "ORD-2024-003",
      customer: "Lê Văn C",
      type: "pre-order",
      total: 1200000,
      status: "awaiting-stock",
      date: "15/01/2024",
      time: "12:00",
      priority: "low",
    },
    {
      id: "ORD-2024-004",
      customer: "Phạm Thị D",
      type: "ready",
      total: 650000,
      status: "processing",
      date: "15/01/2024",
      time: "10:45",
      priority: "normal",
    },
    {
      id: "ORD-2024-005",
      customer: "Hoàng Văn E",
      type: "prescription",
      total: 3200000,
      status: "reviewing",
      date: "15/01/2024",
      time: "09:20",
      priority: "high",
      prescriptionStatus: "reviewing",
    },
  ];

  const prescriptionReviews = [
    {
      id: "ORD-2024-001",
      customer: "Nguyễn Văn A",
      frame: "Gọng Titan Chữ Nhật",
      prescriptionData: {
        odSph: "-2.50",
        osSph: "-2.75",
        pd: "63",
      },
      uploadedImage: true,
      date: "15/01/2024",
      time: "14:30",
    },
    {
      id: "ORD-2024-005",
      customer: "Hoàng Văn E",
      frame: "Gọng Mắt Mèo Acetate",
      prescriptionData: {
        odSph: "-1.25",
        osSph: "-1.50",
        pd: "62",
      },
      uploadedImage: false,
      date: "15/01/2024",
      time: "09:20",
    },
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const getOrderTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      ready: "Hàng sẵn",
      "pre-order": "Đặt trước",
      prescription: "Kính thuốc",
    };
    return labels[type] || type;
  };

  const getPriorityBadge = (priority: string) => {
    const config: Record<string, { label: string; color: string }> = {
      high: {
        label: "Khẩn",
        color: "bg-red-50 text-red-700 border-red-200",
      },
      normal: {
        label: "Thường",
        color: "bg-blue-50 text-blue-700 border-blue-200",
      },
      low: { label: "Thấp", color: "bg-gray-50 text-gray-700 border-gray-200" },
    };

    const { label, color } = config[priority] || config.normal;

    return (
      <span
        className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${color}`}
      >
        {label}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<
      string,
      { label: string; color: string; icon: any }
    > = {
      pending: {
        label: "Chờ xử lý",
        color: "bg-yellow-50 text-yellow-700 border-yellow-200",
        icon: Clock,
      },
      processing: {
        label: "Đang xử lý",
        color: "bg-blue-50 text-blue-700 border-blue-200",
        icon: Package,
      },
      "awaiting-stock": {
        label: "Chờ hàng",
        color: "bg-orange-50 text-orange-700 border-orange-200",
        icon: AlertCircle,
      },
      reviewing: {
        label: "Kiểm tra",
        color: "bg-purple-50 text-purple-700 border-purple-200",
        icon: Eye,
      },
      "ready-to-ship": {
        label: "Sẵn sàng",
        color: "bg-green-50 text-green-700 border-green-200",
        icon: Truck,
      },
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span
        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border ${config.color}`}
      >
        <Icon className="w-3.5 h-3.5" />
        {config.label}
      </span>
    );
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      filterStatus === "all" || order.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl mb-1">Dashboard Nhân Viên</h1>
        <p className="text-sm text-gray-600">
          Bạn có <span className="font-semibold text-primary">{stats.pendingOrders}</span> đơn hàng đang chờ xử lý
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-5 border border-yellow-200">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <button
              onClick={() => setFilterStatus("pending")}
              className="text-xs text-yellow-700 hover:text-yellow-800"
            >
              Xem →
            </button>
          </div>
          <p className="text-3xl text-yellow-900 mb-1">
            {stats.pendingOrders}
          </p>
          <p className="text-xs text-yellow-700">Chờ xử lý</p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 border border-blue-200">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <button
              onClick={() => setFilterStatus("processing")}
              className="text-xs text-blue-700 hover:text-blue-800"
            >
              Xem →
            </button>
          </div>
          <p className="text-3xl text-blue-900 mb-1">
            {stats.processingOrders}
          </p>
          <p className="text-xs text-blue-700">Đang xử lý</p>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-5 border border-orange-200">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-orange-600" />
            </div>
            <button
              onClick={() => setFilterStatus("awaiting-stock")}
              className="text-xs text-orange-700 hover:text-orange-800"
            >
              Xem →
            </button>
          </div>
          <p className="text-3xl text-orange-900 mb-1">
            {stats.awaitingStockOrders}
          </p>
          <p className="text-xs text-orange-700">Chờ hàng</p>
        </div>

        <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-xl p-5 border border-cyan-200">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
              <Eye className="w-5 h-5 text-cyan-600" />
            </div>
            <button
              onClick={() => navigate("/staff/prescriptions")}
              className="text-xs text-cyan-700 hover:text-cyan-800"
            >
              Xem →
            </button>
          </div>
          <p className="text-3xl text-cyan-900 mb-1">
            {stats.prescriptionReviewPending}
          </p>
          <p className="text-xs text-cyan-700">Cần kiểm tra</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-5 border border-green-200">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <p className="text-3xl text-green-900 mb-1">
            {stats.todayCompletedOrders}
          </p>
          <p className="text-xs text-green-700">Hoàn thành hôm nay</p>
        </div>
      </div>

      {/* Prescription Review Section */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-cyan-600" />
            <h2 className="text-lg">Đơn Kính Cần Kiểm Tra</h2>
          </div>
          <span className="text-sm text-gray-600">
            {prescriptionReviews.length} đơn đang chờ
          </span>
        </div>

        <div className="space-y-3">
          {prescriptionReviews.map((review) => (
            <div
              key={review.id}
              className="p-4 bg-cyan-50 rounded-lg border border-cyan-200 hover:border-cyan-300 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-medium mb-1">{review.id}</p>
                  <p className="text-sm text-gray-600">{review.customer}</p>
                </div>
                <div className="text-right text-xs text-gray-500">
                  <div>{review.date}</div>
                  <div>{review.time}</div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-4 p-3 bg-white rounded-lg">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Gọng kính:</p>
                  <p className="text-sm font-medium">{review.frame}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Đơn kính:</p>
                  <div className="text-sm">
                    <span className="font-mono">
                      OD: {review.prescriptionData.odSph}
                    </span>
                    {" | "}
                    <span className="font-mono">
                      OS: {review.prescriptionData.osSph}
                    </span>
                    {" | "}
                    <span className="font-mono">
                      PD: {review.prescriptionData.pd}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  {review.uploadedImage && (
                    <span className="text-xs px-2.5 py-1 bg-white border border-cyan-300 rounded-md inline-flex items-center gap-1">
                      📷 Có ảnh đơn thuốc
                    </span>
                  )}
                </div>
                <button
                  onClick={() => navigate(`/orders/${review.id}`)}
                  className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors text-sm font-medium flex items-center gap-2"
                >
                  Kiểm tra ngay
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={() => navigate("/staff/prescriptions")}
          className="mt-4 w-full py-2.5 text-sm text-cyan-700 hover:bg-cyan-50 rounded-lg transition-colors font-medium"
        >
          Xem tất cả đơn kính →
        </button>
      </div>

      {/* Orders List */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <h2 className="text-lg">Danh Sách Đơn Hàng</h2>
          
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 md:flex-initial">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm đơn hàng..."
                className="w-full md:w-64 pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
              />
            </div>

            {/* Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="pl-9 pr-8 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-primary appearance-none"
              >
                <option value="all">Tất cả</option>
                <option value="pending">Chờ xử lý</option>
                <option value="processing">Đang xử lý</option>
                <option value="awaiting-stock">Chờ hàng</option>
                <option value="reviewing">Đang kiểm tra</option>
                <option value="ready-to-ship">Sẵn sàng giao</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left text-xs font-medium text-gray-600 pb-3">
                  Mã đơn
                </th>
                <th className="text-left text-xs font-medium text-gray-600 pb-3">
                  Khách hàng
                </th>
                <th className="text-left text-xs font-medium text-gray-600 pb-3">
                  Loại
                </th>
                <th className="text-right text-xs font-medium text-gray-600 pb-3">
                  Tổng tiền
                </th>
                <th className="text-center text-xs font-medium text-gray-600 pb-3">
                  Ưu tiên
                </th>
                <th className="text-center text-xs font-medium text-gray-600 pb-3">
                  Trạng thái
                </th>
                <th className="text-right text-xs font-medium text-gray-600 pb-3">
                  Thời gian
                </th>
                <th className="text-center text-xs font-medium text-gray-600 pb-3">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredOrders.map((order) => (
                <tr
                  key={order.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="py-4 text-sm font-medium">{order.id}</td>
                  <td className="py-4 text-sm">{order.customer}</td>
                  <td className="py-4">
                    <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">
                      {getOrderTypeLabel(order.type)}
                    </span>
                  </td>
                  <td className="py-4 text-sm text-right font-medium">
                    {formatCurrency(order.total)}
                  </td>
                  <td className="py-4 text-center">
                    {getPriorityBadge(order.priority)}
                  </td>
                  <td className="py-4 text-center">
                    {getStatusBadge(order.status)}
                  </td>
                  <td className="py-4 text-sm text-right text-gray-600">
                    <div>{order.date}</div>
                    <div className="text-xs">{order.time}</div>
                  </td>
                  <td className="py-4 text-center">
                    <button
                      onClick={() => navigate(`/orders/${order.id}`)}
                      className="px-3 py-1.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-xs font-medium"
                    >
                      Xử lý
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredOrders.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Không tìm thấy đơn hàng phù hợp</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}