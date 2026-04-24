import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useSelector } from "react-redux";
import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle,
  Clock,
  DollarSign,
  Eye,
  Loader2,
  Package,
  RefreshCw,
  ShoppingCart,
  Users,
  XCircle,
} from "lucide-react";
import { AdminErrorBanner, AdminPageShell, AdminSection, adminStyles } from "@/components/admin/admin-ui";
import { getAllOrders, getDashboard, getOrderById, getOrderItems, getProducts, getUsers } from "@/services/adminService";
import { selectAuthState } from "@/store/auth/authSlice";

const DATE_RANGES = {
  today: { label: "Hôm nay", days: 0 },
  "7days": { label: "7 ngày qua", days: 7 },
  "30days": { label: "30 ngày qua", days: 30 },
  "90days": { label: "90 ngày qua", days: 90 },
};

const STATUS_CONFIG = {
  pending: { label: "Chờ xử lý", icon: Clock, className: "bg-amber-50 text-amber-700 border-amber-200" },
  confirmed: { label: "Đã xác nhận", icon: Eye, className: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  processing: { label: "Đang xử lý", icon: Package, className: "bg-sky-50 text-sky-700 border-sky-200" },
  awaitingstock: { label: "Chờ hàng", icon: AlertCircle, className: "bg-orange-50 text-orange-700 border-orange-200" },
  "awaiting-stock": { label: "Chờ hàng", icon: AlertCircle, className: "bg-orange-50 text-orange-700 border-orange-200" },
  reviewing: { label: "Kiểm tra", icon: Eye, className: "bg-violet-50 text-violet-700 border-violet-200" },
  shipped: { label: "Đã gửi hàng", icon: Package, className: "bg-cyan-50 text-cyan-700 border-cyan-200" },
  completed: { label: "Hoàn thành", icon: CheckCircle, className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  delivered: { label: "Đã giao", icon: CheckCircle, className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  cancelled: { label: "Đã hủy", icon: XCircle, className: "bg-red-50 text-red-700 border-red-200" },
};

function formatCurrency(value) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(Number(value ?? 0));
}

function buildDateRange(rangeKey) {
  const now = new Date();
  const endDate = now.toISOString();
  const { days } = DATE_RANGES[rangeKey] ?? DATE_RANGES["7days"];

  if (days === 0) {
    const startDate = new Date(now);
    startDate.setHours(0, 0, 0, 0);
    return { startDate: startDate.toISOString(), endDate };
  }

  const startDate = new Date(now);
  startDate.setDate(now.getDate() - days);
  return { startDate: startDate.toISOString(), endDate };
}

function SummaryCard({ title, value, changePercent, icon: Icon, iconClassName }) {
  const isPositive = Number(changePercent ?? 0) >= 0;

  return (
    <div className={adminStyles.card}>
      <div className={adminStyles.cardBody}>
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className={`flex h-14 w-14 items-center justify-center rounded-[1.2rem] border ${iconClassName}`}>
            <Icon className="h-7 w-7" />
          </div>
          {changePercent == null ? null : (
            <span
              className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-bold ${
                isPositive ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
              }`}
            >
              {isPositive ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
              {Math.abs(Number(changePercent)).toFixed(1)}%
            </span>
          )}
        </div>
        <p className="text-sm font-semibold text-slate-500">{title}</p>
        <p className="mt-2 text-[1.9rem] font-bold text-[#11284b]">{value}</p>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const config = STATUS_CONFIG[normalizeStatus(status)] ?? STATUS_CONFIG.pending;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-bold ${config.className}`}>
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </span>
  );
}

async function enrichOrders(orders, token) {
  const items = Array.isArray(orders) ? orders : [];

  const entries = await Promise.all(
    items.map(async (order) => {
      const orderId = Number(order?.orderId ?? order?.id ?? 0);

      if (!Number.isFinite(orderId) || orderId <= 0) {
        return normalizeAdminOrder(order, null);
      }

      try {
        const detail = await getOrderById(orderId, token);
        let detailItems = Array.isArray(detail?.items) ? detail.items : [];

        if (detail && detailItems.length === 0) {
          try {
            detailItems = (await getOrderItems(orderId, token))?.items ?? [];
          } catch {
            detailItems = [];
          }
        }

        return normalizeAdminOrder(order, detail ? { ...detail, items: detailItems } : null);
      } catch {
        return normalizeAdminOrder(order, null);
      }
    }),
  );

  return entries;
}

function normalizeAdminOrder(order, detail) {
  const source = detail ?? order ?? {};
  const detailItems = Array.isArray(detail?.items) ? detail.items : [];

  return {
    ...order,
    detail,
    items: detailItems,
    orderId: Number(source.orderId ?? order?.orderId ?? order?.id ?? 0),
    customerName:
      normalizeText(source.customerName) ??
      normalizeText(source.receiverName) ??
      normalizeText(order?.customer) ??
      normalizeText(order?.customerName) ??
      "-",
    receiverName: normalizeText(source.receiverName) ?? normalizeText(order?.receiverName) ?? "",
    totalAmount: Number(source.totalAmount ?? order?.totalAmount ?? order?.total ?? 0),
    orderStatus: source.orderStatus ?? order?.orderStatus ?? order?.status ?? "",
    status: source.orderStatus ?? order?.orderStatus ?? order?.status ?? "",
    shippingStatus: source.shippingStatus ?? order?.shippingStatus ?? "",
    paymentStatus: source.payment?.paymentStatus ?? order?.paymentStatus ?? "",
    createdAt: source.createdAt ?? order?.createdAt ?? null,
  };
}

function deriveDashboardData({ dashboard, ordersPage, orders, customersPage, productsPage }) {
  const rangeOrders = Array.isArray(orders) && orders.length > 0
    ? orders
    : Array.isArray(ordersPage?.items)
      ? ordersPage.items.map((order) => normalizeAdminOrder(order, null))
      : [];
  const derivedStatusCounts = deriveOrdersByStatus(rangeOrders);
  const dashboardStatusCounts = normalizeOrdersByStatus(dashboard?.ordersByStatus);
  const ordersByStatus = sumObjectValues(dashboardStatusCounts) > 0 ? dashboardStatusCounts : derivedStatusCounts;
  const fallbackOrderCount = getPageTotal(ordersPage, rangeOrders.length);
  const fallbackRevenue = rangeOrders
    .filter((order) => {
      const status = normalizeStatus(order.orderStatus);
      return status === "completed" || status === "delivered";
    })
    .reduce((total, order) => total + Number(order.totalAmount ?? 0), 0);
  const topProducts = normalizeTopProducts(dashboard?.topProducts);

  return {
    ...dashboard,
    revenue: normalizeMetric(dashboard?.revenue, fallbackRevenue),
    totalOrders: normalizeMetric(dashboard?.totalOrders, fallbackOrderCount),
    totalCustomers: normalizeMetric(dashboard?.totalCustomers, getPageTotal(customersPage, 0)),
    totalProducts: normalizeMetric(dashboard?.totalProducts, getPageTotal(productsPage, 0)),
    ordersByStatus,
    topProducts: topProducts.length > 0 ? topProducts : deriveTopProducts(rangeOrders),
  };
}

function normalizeMetric(metric, fallbackValue) {
  if (metric && typeof metric === "object") {
    const rawCurrent = Number(metric.current ?? metric.total ?? 0);
    const fallback = Number(fallbackValue ?? 0);
    const current = rawCurrent > 0 || fallback <= 0 ? rawCurrent : fallback;
    return {
      ...metric,
      current: Number.isFinite(current) ? current : 0,
      total: Number.isFinite(Number(metric.total)) ? Number(metric.total) : current,
    };
  }

  const rawValue = Number(metric ?? 0);
  const fallback = Number(fallbackValue ?? 0);
  const value = rawValue > 0 || fallback <= 0 ? rawValue : fallback;

  return {
    current: Number.isFinite(value) ? value : 0,
    total: Number.isFinite(value) ? value : 0,
  };
}

function getPageTotal(page, fallbackValue) {
  const value = Number(page?.totalItems ?? page?.totalCount ?? page?.total ?? fallbackValue ?? 0);
  return Number.isFinite(value) ? value : 0;
}

function normalizeOrdersByStatus(rawStatusCounts) {
  if (!rawStatusCounts || typeof rawStatusCounts !== "object") {
    return {};
  }

  return Object.fromEntries(
    Object.entries(rawStatusCounts).map(([status, count]) => [normalizeStatus(status), Number(count ?? 0)]),
  );
}

function sumObjectValues(values) {
  return Object.values(values ?? {}).reduce((total, value) => total + Number(value ?? 0), 0);
}

function deriveOrdersByStatus(orders) {
  return (Array.isArray(orders) ? orders : []).reduce((counts, order) => {
    const key = normalizeStatus(order.orderStatus ?? order.status);
    counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {});
}

function normalizeTopProducts(products) {
  return (Array.isArray(products) ? products : [])
    .map((product) => ({
      name: product.name ?? product.productName ?? "-",
      soldCount: Number(product.soldCount ?? product.sold ?? product.quantity ?? 0),
      revenue: Number(product.revenue ?? product.totalRevenue ?? 0),
    }))
    .filter((product) => product.name !== "-");
}

function deriveTopProducts(orders) {
  const productMap = new Map();

  (Array.isArray(orders) ? orders : []).forEach((order) => {
    const items = Array.isArray(order.items) ? order.items : [];

    items.forEach((item) => {
      const key = String(item.productId ?? item.variantId ?? item.productName ?? "");

      if (!key) {
        return;
      }

      const current = productMap.get(key) ?? {
        name: item.productName ?? item.name ?? `Sản phẩm #${key}`,
        soldCount: 0,
        revenue: 0,
      };

      const quantity = Number(item.quantity ?? 0);
      current.soldCount += Number.isFinite(quantity) ? quantity : 0;
      current.revenue += Number(item.lineTotal ?? item.totalPrice ?? item.unitPrice * quantity ?? 0) || 0;
      productMap.set(key, current);
    });
  });

  return Array.from(productMap.values())
    .sort((a, b) => b.soldCount - a.soldCount || b.revenue - a.revenue)
    .slice(0, 5);
}

function normalizeStatus(status) {
  return String(status ?? "pending")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");
}

function normalizeText(value) {
  const normalizedValue = String(value ?? "").trim();
  return normalizedValue.length > 0 ? normalizedValue : null;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { accessToken } = useSelector(selectAuthState);

  const [dateRange, setDateRange] = useState("7days");
  const [dashboardData, setDashboardData] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      if (!accessToken) {
        throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
      }

      const range = buildDateRange(dateRange);
      const orderRangeFilters = {
        fromDate: range.startDate,
        toDate: range.endDate,
        sortBy: "createdAt",
        sortOrder: "desc",
      };
      const [dashboardResult, ordersResult, recentOrdersResult, customersResult, productsResult] = await Promise.allSettled([
        getDashboard(range, accessToken),
        getAllOrders({ ...orderRangeFilters, page: 1, pageSize: 200 }, accessToken),
        getAllOrders({ page: 1, pageSize: 5, sortBy: "createdAt", sortOrder: "desc" }, accessToken),
        getUsers({ page: 1, pageSize: 1, role: "customer" }, accessToken),
        getProducts({ page: 1, pageSize: 1 }, accessToken),
      ]);

      const dashboard = dashboardResult.status === "fulfilled" ? dashboardResult.value : null;
      const ordersPage = ordersResult.status === "fulfilled" ? ordersResult.value : null;
      const recentOrdersPage = recentOrdersResult.status === "fulfilled" ? recentOrdersResult.value : null;
      const enrichedRangeOrders = await enrichOrders((ordersPage?.items ?? []).slice(0, 50), accessToken);
      const enrichedRecentOrders = await enrichOrders(recentOrdersPage?.items ?? [], accessToken);
      const derivedDashboard = deriveDashboardData({
        dashboard,
        ordersPage,
        orders: enrichedRangeOrders,
        recentOrders: enrichedRecentOrders,
        customersPage: customersResult.status === "fulfilled" ? customersResult.value : null,
        productsPage: productsResult.status === "fulfilled" ? productsResult.value : null,
      });

      setDashboardData(derivedDashboard);
      setRecentOrders(enrichedRecentOrders);
    } catch (fetchError) {
      setDashboardData(null);
      setRecentOrders([]);
      setError(fetchError.message || "Không thể tải dashboard.");
    } finally {
      setLoading(false);
    }
  }, [accessToken, dateRange]);

  useEffect(() => {
    void fetchDashboard();
  }, [fetchDashboard]);

  const revenue = dashboardData?.revenue ?? {};
  const totalOrders = dashboardData?.totalOrders ?? {};
  const totalCustomers = dashboardData?.totalCustomers ?? {};
  const totalProducts = dashboardData?.totalProducts ?? {};
  const ordersByStatus = dashboardData?.ordersByStatus ?? {};
  const topProducts = dashboardData?.topProducts ?? [];
  const totalOrdersValue = Number(totalOrders.current ?? totalOrders.total ?? 0);

  const statusOverviewItems = [
    {
      label: "Chờ xử lý",
      count: Number(ordersByStatus.pending ?? 0),
      className: "border-amber-200 bg-amber-50 text-amber-700",
    },
    {
      label: "Đã xác nhận",
      count: Number(ordersByStatus.confirmed ?? 0),
      className: "border-indigo-200 bg-indigo-50 text-indigo-700",
    },
    {
      label: "Chờ hàng",
      count: Number(ordersByStatus.awaitingstock ?? 0),
      className: "border-orange-200 bg-orange-50 text-orange-700",
    },
    {
      label: "Đang xử lý",
      count: Number(ordersByStatus.processing ?? 0),
      className: "border-sky-200 bg-sky-50 text-sky-700",
    },
    {
      label: "Đã gửi hàng",
      count: Number(ordersByStatus.shipped ?? 0),
      className: "border-cyan-200 bg-cyan-50 text-cyan-700",
    },
    {
      label: "Hoàn thành",
      count: Number(ordersByStatus.completed ?? 0) + Number(ordersByStatus.delivered ?? 0),
      className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    },
    {
      label: "Đã hủy",
      count: Number(ordersByStatus.cancelled ?? 0),
      className: "border-red-200 bg-red-50 text-red-700",
    },
  ];
  const trackedStatusTotal = statusOverviewItems.reduce((sum, item) => sum + Number(item.count ?? 0), 0);
  const otherStatusCount = Math.max(0, totalOrdersValue - trackedStatusTotal);

  return (
    <AdminPageShell
      title="Dashboard Tổng Quan"
      actions={
        <>
          <select
            value={dateRange}
            onChange={(event) => setDateRange(event.target.value)}
            className={adminStyles.input}
          >
            {Object.entries(DATE_RANGES).map(([key, item]) => (
              <option key={key} value={key}>
                {item.label}
              </option>
            ))}
          </select>
          <button type="button" onClick={fetchDashboard} className={adminStyles.secondaryButton} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Tải lại
          </button>
        </>
      }
    >
      <AdminErrorBanner message={error} />

      {loading ? (
        <div className="flex min-h-[320px] items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-orange-500" />
        </div>
      ) : (
        <>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              title="Tổng doanh thu"
              value={formatCurrency(revenue.current ?? revenue.total)}
              changePercent={revenue.changePercent}
              icon={DollarSign}
              iconClassName="border-emerald-200 bg-emerald-50 text-emerald-600"
            />
            <SummaryCard
              title="Tổng đơn hàng"
              value={(totalOrders.current ?? totalOrders.total ?? 0).toLocaleString("vi-VN")}
              changePercent={totalOrders.changePercent}
              icon={ShoppingCart}
              iconClassName="border-sky-200 bg-sky-50 text-sky-600"
            />
            <SummaryCard
              title="Khách hàng"
              value={(totalCustomers.current ?? totalCustomers.total ?? 0).toLocaleString("vi-VN")}
              changePercent={totalCustomers.changePercent}
              icon={Users}
              iconClassName="border-violet-200 bg-violet-50 text-violet-600"
            />
            <SummaryCard
              title="Sản phẩm"
              value={(totalProducts.current ?? totalProducts.total ?? 0).toLocaleString("vi-VN")}
              icon={Package}
              iconClassName="border-orange-200 bg-orange-50 text-orange-600"
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.6fr,1fr]">
            <AdminSection title="Trạng thái đơn hàng">
              <div className="grid gap-4 sm:grid-cols-2">
                {statusOverviewItems.map((item) => (
                  <div key={item.label} className={`rounded-[1.4rem] border p-5 ${item.className}`}>
                    <p className="text-sm font-semibold text-slate-600">{item.label}</p>
                    <p className="mt-2 text-3xl font-bold">{item.count}</p>
                  </div>
                ))}
                {otherStatusCount > 0 ? (
                  <div className="rounded-[1.4rem] border border-slate-200 bg-slate-50 p-5 text-slate-700">
                    <p className="text-sm font-semibold text-slate-600">Khác</p>
                    <p className="mt-2 text-3xl font-bold">{otherStatusCount}</p>
                  </div>
                ) : null}
              </div>
            </AdminSection>

            <AdminSection title="Sản phẩm bán chạy">
              {topProducts.length === 0 ? (
                <p className="py-8 text-center text-slate-500">Chưa có dữ liệu.</p>
              ) : (
                <div className="space-y-3">
                  {topProducts.map((product, index) => (
                    <div key={`${product.name ?? product.productName}-${index}`} className="rounded-[1.3rem] border border-orange-100 bg-[#fff8ef] p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500/10 text-sm font-bold text-orange-600">
                          #{index + 1}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-bold text-[#11284b]">{product.name ?? product.productName ?? "-"}</p>
                          <p className="mt-1 text-sm text-slate-500">{product.soldCount ?? product.sold ?? 0} đã bán</p>
                          <p className="mt-2 font-bold text-orange-600">{formatCurrency(product.revenue ?? 0)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </AdminSection>
          </div>

          <AdminSection
            title="Đơn hàng gần đây"
            actions={
              <button type="button" className={adminStyles.secondaryButton} onClick={() => navigate("/admin/orders")}>
                Xem tất cả
              </button>
            }
          >
            <div className={adminStyles.tableWrapper}>
              <table className={adminStyles.table}>
                <thead className={adminStyles.tableHead}>
                  <tr>
                    <th className={adminStyles.th}>Mã đơn</th>
                    <th className={adminStyles.th}>Khách hàng</th>
                    <th className={adminStyles.th}>Tổng tiền</th>
                    <th className={adminStyles.th}>Trạng thái</th>
                    <th className={adminStyles.th}>Thời gian</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {recentOrders.length === 0 ? (
                    <tr>
                      <td colSpan={5} className={adminStyles.emptyState}>
                        Chưa có đơn hàng nào.
                      </td>
                    </tr>
                  ) : (
                    recentOrders.map((order) => (
                      <tr
                        key={order.orderId ?? order.id}
                        className="cursor-pointer transition hover:bg-orange-50/50"
                        onClick={() => navigate(`/admin/orders/${order.orderId ?? order.id}`)}
                      >
                        <td className={adminStyles.td}>#{order.orderId ?? order.id}</td>
                        <td className={adminStyles.td}>{order.customerName ?? order.receiverName ?? order.customer ?? "-"}</td>
                        <td className={`${adminStyles.td} font-bold text-orange-600`}>
                          {formatCurrency(order.totalAmount ?? order.total)}
                        </td>
                        <td className={adminStyles.td}>
                          <StatusBadge status={order.status ?? order.orderStatus} />
                        </td>
                        <td className={adminStyles.td}>
                          {order.createdAt
                            ? new Date(order.createdAt).toLocaleString("vi-VN", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "-"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </AdminSection>
        </>
      )}
    </AdminPageShell>
  );
}
