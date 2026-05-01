import { useCallback, useEffect, useMemo, useState } from "react";
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
  Loader2,
} from "lucide-react";
import { getAllOrders, getOrderById } from "@/services/adminService";
import { getPrescriptionById, getPrescriptions } from "@/services/prescriptionService";
import { selectAuthState } from "@/store/auth/authSlice";
import { useAppSelector } from "@/store/hooks";

const STATUS_FILTER_OPTIONS = [
  { value: "all", label: "Tất cả" },
  { value: "pending", label: "Chờ xử lý" },
  { value: "processing", label: "Đang xử lý" },
  { value: "awaitingstock", label: "Chờ hàng" },
  { value: "completed", label: "Hoàn thành" },
  { value: "cancelled", label: "Đã hủy" },
];

function StaffDashboard() {
  const navigate = useNavigate();
  const auth = useAppSelector(selectAuthState);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [state, setState] = useState({
    status: "idle",
    error: "",
    orders: [],
    prescriptionReviews: [],
    stats: {
      pendingOrders: 0,
      processingOrders: 0,
      awaitingStockOrders: 0,
      prescriptionReviewPending: 0,
      todayCompletedOrders: 0,
    },
  });

  const loadDashboard = useCallback(async () => {
    if (!auth.accessToken) {
      setState((current) => ({
        ...current,
        status: "failed",
        error: "Không có access token.",
      }));
      return;
    }

    setState((current) => ({
      ...current,
      status: "loading",
      error: "",
    }));

    try {
      const [allOrders, allPrescriptions] = await Promise.all([
        fetchAllPages((page) =>
          getAllOrders(
            {
              page,
              pageSize: 100,
              sortBy: "createdAt",
              sortOrder: "desc",
            },
            auth.accessToken,
          ),
        ),
        fetchAllPages((page) =>
          getPrescriptions(
            {
              page,
              pageSize: 100,
              sortBy: "createdAt",
              sortOrder: "desc",
            },
            auth.accessToken,
          ),
        ),
      ]);

      const normalizedOrders = allOrders.map((order) => normalizeOrder(order));
      const prescriptionPendingRows = allPrescriptions.filter((item) =>
        ["submitted", "reviewing"].includes(normalizeValue(item?.prescriptionStatus)),
      );
      const rawPrescriptionReviews = await Promise.all(
        prescriptionPendingRows.map((item) => buildPrescriptionReviewCard(item, auth.accessToken)),
      );
      const activePrescriptionReviews = dedupePrescriptionReviews(rawPrescriptionReviews.filter(Boolean));
      const prescriptionReviews = activePrescriptionReviews.slice(0, 3);

      setState({
        status: "succeeded",
        error: "",
        orders: normalizedOrders,
        prescriptionReviews,
        stats: {
          pendingOrders: normalizedOrders.filter((order) => order.normalizedStatus === "pending").length,
          processingOrders: normalizedOrders.filter((order) => order.normalizedStatus === "processing").length,
          awaitingStockOrders: normalizedOrders.filter((order) => order.normalizedStatus === "awaitingstock").length,
          prescriptionReviewPending: activePrescriptionReviews.length,
          todayCompletedOrders: normalizedOrders.filter(
            (order) => order.normalizedStatus === "completed" && isSameVnDate(order.updatedAt || order.createdAt, new Date()),
          ).length,
        },
      });
    } catch (error) {
      setState((current) => ({
        ...current,
        status: "failed",
        error: resolveErrorMessage(error, "Không tải được dashboard staff từ API."),
      }));
    }
  }, [auth.accessToken]);

  useEffect(() => {
    if (!auth.isReady || !auth.accessToken) {
      return;
    }

    void loadDashboard();
  }, [auth.accessToken, auth.isReady, loadDashboard]);

  const filteredOrders = useMemo(() => {
    const normalizedQuery = normalizeValue(searchQuery);

    return state.orders.filter((order) => {
      const matchesSearch = !normalizedQuery
        || normalizeValue(`${order.orderCode} ${order.customer}`).includes(normalizedQuery);
      const matchesFilter = filterStatus === "all" || order.normalizedStatus === filterStatus;
      return matchesSearch && matchesFilter;
    });
  }, [filterStatus, searchQuery, state.orders]);

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(Number(amount || 0));

  const getOrderTypeLabel = (type) => {
    const normalizedType = normalizeValue(type);
    if (normalizedType === "ready") return "Hàng sẵn";
    if (normalizedType === "preorder") return "Đặt trước";
    if (normalizedType === "prescription") return "Kính thuốc";
    return type || "-";
  };

  const getPriorityBadge = (priority) => {
    const config = {
      high: {
        label: "Khẩn",
        color: "bg-red-50 text-red-700 border-red-200",
      },
      normal: {
        label: "Thường",
        color: "bg-blue-50 text-blue-700 border-blue-200",
      },
      low: {
        label: "Thấp",
        color: "bg-gray-50 text-gray-700 border-gray-200",
      },
    };
    const { label, color } = config[priority] || config.normal;
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${color}`}>
        {label}
      </span>
    );
  };

  const getStatusBadge = (status) => {
    const normalizedStatus = normalizeValue(status);
    const statusConfig = {
      pending: {
        label: "Chờ xử lý",
        color: "bg-yellow-50 text-yellow-700 border-yellow-200",
        icon: Clock,
      },
      confirmed: {
        label: "Đã xác nhận",
        color: "bg-cyan-50 text-cyan-700 border-cyan-200",
        icon: CheckCircle,
      },
      processing: {
        label: "Đang xử lý",
        color: "bg-blue-50 text-blue-700 border-blue-200",
        icon: Package,
      },
      awaitingstock: {
        label: "Chờ hàng",
        color: "bg-orange-50 text-orange-700 border-orange-200",
        icon: AlertCircle,
      },
      shipped: {
        label: "Đang giao",
        color: "bg-indigo-50 text-indigo-700 border-indigo-200",
        icon: Truck,
      },
      completed: {
        label: "Hoàn thành",
        color: "bg-green-50 text-green-700 border-green-200",
        icon: CheckCircle,
      },
      cancelled: {
        label: "Đã hủy",
        color: "bg-gray-100 text-gray-700 border-gray-300",
        icon: AlertCircle,
      },
    };
    const config = statusConfig[normalizedStatus] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border ${config.color}`}>
        <Icon className="w-3.5 h-3.5" />
        {config.label}
      </span>
    );
  };

  const isLoading = state.status === "loading";

  return (
    <div className="min-h-screen bg-[#fffaf2] p-6 space-y-6 md:p-6 lg:p-8">
      <div>
        <h1 className="text-2xl mb-1">Dashboard Nhân Viên</h1>
        <p className="text-sm text-gray-600">
          Bạn có <span className="font-semibold text-primary">{state.stats.pendingOrders}</span> đơn hàng đang chờ xử lý
        </p>
      </div>

      {state.error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-5 border border-yellow-200">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <button
              type="button"
              onClick={() => setFilterStatus("pending")}
              className="text-xs text-yellow-700 hover:text-yellow-800"
            >
              Xem →
            </button>
          </div>
          <p className="text-3xl text-yellow-900 mb-1">{state.stats.pendingOrders}</p>
          <p className="text-xs text-yellow-700">Chờ xử lý</p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 border border-blue-200">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <button
              type="button"
              onClick={() => setFilterStatus("processing")}
              className="text-xs text-blue-700 hover:text-blue-800"
            >
              Xem →
            </button>
          </div>
          <p className="text-3xl text-blue-900 mb-1">{state.stats.processingOrders}</p>
          <p className="text-xs text-blue-700">Đang xử lý</p>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-5 border border-orange-200">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-orange-600" />
            </div>
            <button
              type="button"
              onClick={() => setFilterStatus("awaitingstock")}
              className="text-xs text-orange-700 hover:text-orange-800"
            >
              Xem →
            </button>
          </div>
          <p className="text-3xl text-orange-900 mb-1">{state.stats.awaitingStockOrders}</p>
          <p className="text-xs text-orange-700">Chờ hàng</p>
        </div>

        <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-xl p-5 border border-cyan-200">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
              <Eye className="w-5 h-5 text-cyan-600" />
            </div>
            <button
              type="button"
              onClick={() => navigate("/staff/prescriptions")}
              className="text-xs text-cyan-700 hover:text-cyan-800"
            >
              Xem →
            </button>
          </div>
          <p className="text-3xl text-cyan-900 mb-1">{state.stats.prescriptionReviewPending}</p>
          <p className="text-xs text-cyan-700">Cần kiểm tra</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-5 border border-green-200">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <p className="text-3xl text-green-900 mb-1">{state.stats.todayCompletedOrders}</p>
          <p className="text-xs text-green-700">Hoàn thành hôm nay</p>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-cyan-600" />
            <h2 className="text-lg">Đơn Kính Cần Kiểm Tra</h2>
          </div>
          <span className="text-sm text-gray-600">{state.stats.prescriptionReviewPending} đơn đang chờ</span>
        </div>

        {isLoading ? (
          <div className="rounded-lg border border-cyan-200 bg-cyan-50 p-4 text-sm text-cyan-700">
            <Loader2 className="inline-block h-4 w-4 animate-spin align-[-2px]" /> Đang tải danh sách đơn kính...
          </div>
        ) : state.prescriptionReviews.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            Không có đơn kính cần kiểm tra.
          </div>
        ) : (
          <div className="space-y-3">
            {state.prescriptionReviews.map((review) => (
              <div
                key={`${review.orderId || "na"}-${review.prescriptionId}`}
                className="p-4 bg-cyan-50 rounded-lg border border-cyan-200 hover:border-cyan-300 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-medium mb-1">#{review.orderId || review.prescriptionId}</p>
                    <p className="text-sm text-gray-600">{review.customer}</p>
                  </div>
                  <div className="text-right text-xs text-gray-500">
                    <div>{formatDate(review.createdAt)}</div>
                    <div>{formatTime(review.createdAt)}</div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-4 p-3 bg-white rounded-lg">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Gọng kính:</p>
                    <p className="text-sm font-medium">{review.frameName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Đơn kính:</p>
                    <div className="text-sm">
                      <span className="font-mono">OD: {review.prescriptionData.odSph}</span>
                      {" | "}
                      <span className="font-mono">OS: {review.prescriptionData.osSph}</span>
                      {" | "}
                      <span className="font-mono">PD: {review.prescriptionData.pd}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    {review.uploadedImage ? (
                      <span className="text-xs px-2.5 py-1 bg-white border border-cyan-300 rounded-md inline-flex items-center gap-1">
                        Có ảnh đơn thuốc
                      </span>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate(review.prescriptionId > 0 ? `/staff/prescriptions?prescriptionId=${review.prescriptionId}` : "/staff/prescriptions")}
                    className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors text-sm font-medium flex items-center gap-2"
                  >
                    Kiểm tra ngay
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={() => navigate("/staff/prescriptions")}
          className="mt-4 w-full py-2.5 text-sm text-cyan-700 hover:bg-cyan-50 rounded-lg transition-colors font-medium"
        >
          Xem tất cả đơn kính →
        </button>
      </div>

      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <h2 className="text-lg">Danh Sách Đơn Hàng</h2>

          <div className="flex items-center gap-3">
            <div className="relative flex-1 md:flex-initial">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Tìm đơn hàng..."
                className="w-full md:w-64 pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
              />
            </div>

            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <select
                value={filterStatus}
                onChange={(event) => setFilterStatus(event.target.value)}
                className="pl-9 pr-8 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-primary appearance-none"
              >
                {STATUS_FILTER_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left text-xs font-medium text-gray-600 pb-3">Mã đơn</th>
                <th className="text-left text-xs font-medium text-gray-600 pb-3">Khách hàng</th>
                <th className="text-left text-xs font-medium text-gray-600 pb-3">Loại</th>
                <th className="text-right text-xs font-medium text-gray-600 pb-3">Tổng tiền</th>
                <th className="text-center text-xs font-medium text-gray-600 pb-3">Ưu tiên</th>
                <th className="text-center text-xs font-medium text-gray-600 pb-3">Trạng thái</th>
                <th className="text-right text-xs font-medium text-gray-600 pb-3">Thời gian</th>
                <th className="text-center text-xs font-medium text-gray-600 pb-3">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredOrders.map((order) => (
                <tr key={order.orderId} className="hover:bg-gray-50 transition-colors">
                  <td className="py-4 text-sm font-medium">{order.orderCode}</td>
                  <td className="py-4 text-sm">{order.customer}</td>
                  <td className="py-4">
                    <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">{getOrderTypeLabel(order.type)}</span>
                  </td>
                  <td className="py-4 text-sm text-right font-medium">{formatCurrency(order.total)}</td>
                  <td className="py-4 text-center">{getPriorityBadge(order.priority)}</td>
                  <td className="py-4 text-center">{getStatusBadge(order.status)}</td>
                  <td className="py-4 text-sm text-right text-gray-600">
                    <div>{formatDate(order.createdAt)}</div>
                    <div className="text-xs">{formatTime(order.createdAt)}</div>
                  </td>
                  <td className="py-4 text-center">
                    <button
                      type="button"
                      onClick={() => navigate(`/staff/orders/${order.orderId}`)}
                      className="px-3 py-1.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-xs font-medium"
                    >
                      Xử lý
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {isLoading ? (
            <div className="text-center py-12 text-gray-500">
              <Loader2 className="w-12 h-12 mx-auto mb-3 opacity-70 animate-spin" />
              <p>Đang tải đơn hàng...</p>
            </div>
          ) : null}

          {!isLoading && filteredOrders.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Không tìm thấy đơn hàng phù hợp</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

async function fetchAllPages(loader) {
  const items = [];
  let currentPage = 1;
  let totalPages = 1;

  while (currentPage <= totalPages) {
    const response = await loader(currentPage);
    const pageItems = Array.isArray(response?.items) ? response.items : [];
    items.push(...pageItems);

    const detectedTotalPages = Number(response?.totalPages ?? 1);
    if (!Number.isFinite(detectedTotalPages) || detectedTotalPages < 1) {
      break;
    }

    totalPages = detectedTotalPages;
    if (currentPage >= totalPages) {
      break;
    }

    currentPage += 1;
  }

  return items;
}

function normalizeOrder(order) {
  const normalizedStatus = normalizeValue(order?.orderStatus);
  return {
    orderId: Number(order?.orderId ?? 0),
    orderCode: `#${order?.orderId ?? "N/A"}`,
    customer: String(order?.receiverName ?? "").trim() || "Khách hàng",
    type: order?.orderType ?? "",
    total: Number(order?.totalAmount ?? 0),
    status: order?.orderStatus ?? "",
    normalizedStatus,
    createdAt: order?.createdAt ?? null,
    updatedAt: order?.updatedAt ?? null,
    priority: resolvePriority(order?.orderType, normalizedStatus),
  };
}

async function buildPrescriptionReviewCard(item, accessToken) {
  const prescriptionId = Number(item?.prescriptionId ?? 0);
  const orderId = Number(item?.orderId ?? 0);

  const [detail, order] = await Promise.all([
    Number.isFinite(prescriptionId) && prescriptionId > 0
      ? getPrescriptionById(prescriptionId, accessToken).catch(() => null)
      : Promise.resolve(null),
    Number.isFinite(orderId) && orderId > 0
      ? getOrderById(orderId, accessToken).catch(() => null)
      : Promise.resolve(null),
  ]);

  const orderStatus = normalizeValue(order?.orderStatus ?? item?.orderStatus);
  if (orderStatus === "cancelled") {
    return null;
  }

  const firstOrderItem = Array.isArray(order?.items) ? order.items[0] : null;

  return {
    prescriptionId,
    orderId,
    customer: String(item?.customerName ?? "").trim() || String(order?.receiverName ?? "").trim() || "Khách hàng",
    frameName: firstOrderItem?.productName || firstOrderItem?.sku || "Chưa có thông tin gọng",
    prescriptionData: {
      odSph: formatPrescriptionValue(detail?.rightEye?.sph),
      osSph: formatPrescriptionValue(detail?.leftEye?.sph),
      pd: formatPdValue(detail?.pd),
    },
    uploadedImage: Boolean(item?.prescriptionImageUrl || detail?.prescriptionImageUrl),
    createdAt: item?.createdAt ?? detail?.createdAt ?? order?.createdAt ?? null,
  };
}

function dedupePrescriptionReviews(reviews) {
  const uniqueMap = new Map();

  (Array.isArray(reviews) ? reviews : []).forEach((review) => {
    const orderId = Number(review?.orderId ?? 0);
    const key = orderId > 0
      ? `order-${orderId}`
      : [
          normalizeValue(review?.customer),
          normalizeValue(review?.frameName),
          normalizeValue(review?.prescriptionData?.odSph),
          normalizeValue(review?.prescriptionData?.osSph),
          normalizeValue(review?.prescriptionData?.pd),
        ].join("|");

    const current = uniqueMap.get(key);
    if (!current || toTimestamp(review?.createdAt) > toTimestamp(current?.createdAt)) {
      uniqueMap.set(key, review);
    }
  });

  return Array.from(uniqueMap.values()).sort((left, right) => toTimestamp(right?.createdAt) - toTimestamp(left?.createdAt));
}

function resolvePriority(orderType, normalizedStatus) {
  const normalizedType = normalizeValue(orderType);
  if (normalizedStatus === "awaitingstock") {
    return "high";
  }
  if (normalizedType === "prescription" && ["pending", "confirmed", "processing"].includes(normalizedStatus)) {
    return "high";
  }
  if (normalizedStatus === "completed" || normalizedStatus === "cancelled") {
    return "low";
  }
  return "normal";
}

function formatDate(value) {
  if (!value) {
    return "-";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(date);
}

function formatTime(value) {
  if (!value) {
    return "-";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }
  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(date);
}

function normalizeValue(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");
}

function formatPrescriptionValue(value) {
  const numericValue = Number(value ?? NaN);
  if (!Number.isFinite(numericValue)) {
    return "-";
  }
  const abs = Math.abs(numericValue).toFixed(2);
  if (numericValue > 0) {
    return `+${abs}`;
  }
  if (numericValue < 0) {
    return `-${abs}`;
  }
  return "0.00";
}

function formatPdValue(value) {
  const numericValue = Number(value ?? NaN);
  if (!Number.isFinite(numericValue)) {
    return "-";
  }
  return Number.isInteger(numericValue) ? String(numericValue) : numericValue.toFixed(2);
}

function toTimestamp(value) {
  if (!value) {
    return 0;
  }

  const date = value instanceof Date ? value : new Date(value);
  const timestamp = date.getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function isSameVnDate(left, right) {
  const leftKey = toVnDateKey(left);
  const rightKey = toVnDateKey(right);
  return Boolean(leftKey) && leftKey === rightKey;
}

function toVnDateKey(value) {
  if (!value) {
    return "";
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(date);
}

function resolveErrorMessage(error, fallbackMessage) {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }
  if (typeof error === "string" && error.trim().length > 0) {
    return error;
  }
  return fallbackMessage;
}

export { StaffDashboard as default };


