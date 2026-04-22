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
import { getAllOrders, getDashboard } from "@/services/adminService";
import { selectAuthState } from "@/store/auth/authSlice";

const DATE_RANGES = {
  today: { label: "Hôm nay", days: 0 },
  "7days": { label: "7 ngay qua", days: 7 },
  "30days": { label: "30 ngay qua", days: 30 },
  "90days": { label: "90 ngay qua", days: 90 },
};

const STATUS_CONFIG = {
  pending: { label: "Cho xử lý", icon: Clock, className: "bg-amber-50 text-amber-700 border-amber-200" },
  processing: { label: "Đang xử lý", icon: Package, className: "bg-sky-50 text-sky-700 border-sky-200" },
  "awaiting-stock": { label: "Chờ hàng", icon: AlertCircle, className: "bg-orange-50 text-orange-700 border-orange-200" },
  reviewing: { label: "Kiểm tra", icon: Eye, className: "bg-violet-50 text-violet-700 border-violet-200" },
  completed: { label: "Hoan thành", icon: CheckCircle, className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
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
              {Mãth.abs(Number(changePercent)).toFixed(1)}%
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
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-bold ${config.className}`}>
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </span>
  );
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

      const [dashboard, ordersResult] = await Promise.all([
        getDashboard(buildDateRange(dateRange), accessToken),
        getAllOrders({ page: 1, pageSize: 5, sortBy: "createdAt", sortOrder: "desc" }, accessToken),
      ]);

      setDashboardData(dashboard);
      setRecentOrders(ordersResult?.items ?? []);
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
              title="Tổng doảnh thu"
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
                <div className="rounded-[1.4rem] border border-amber-200 bg-amber-50 p-5">
                  <p className="text-sm font-semibold text-slate-600">Cho xử lý</p>
                  <p className="mt-2 text-3xl font-bold text-amber-700">{ordersByStatus.pending ?? 0}</p>
                </div>
                <div className="rounded-[1.4rem] border border-sky-200 bg-sky-50 p-5">
                  <p className="text-sm font-semibold text-slate-600">Đang xử lý</p>
                  <p className="mt-2 text-3xl font-bold text-sky-700">{ordersByStatus.processing ?? 0}</p>
                </div>
                <div className="rounded-[1.4rem] border border-emerald-200 bg-emerald-50 p-5">
                  <p className="text-sm font-semibold text-slate-600">Hoan thành</p>
                  <p className="mt-2 text-3xl font-bold text-emerald-700">
                    {ordersByStatus.completed ?? ordersByStatus.delivered ?? 0}
                  </p>
                </div>
                <div className="rounded-[1.4rem] border border-red-200 bg-red-50 p-5">
                  <p className="text-sm font-semibold text-slate-600">Đã hủy</p>
                  <p className="mt-2 text-3xl font-bold text-red-700">{ordersByStatus.cancelled ?? 0}</p>
                </div>
              </div>
            </AdminSection>

            <AdminSection title="Sản phẩm ban chay">
              {topProducts.length === 0 ? (
                <p className="py-8 text-center text-slate-500">Chưa có du lieu.</p>
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
                          <p className="mt-1 text-sm text-slate-500">{product.soldCount ?? product.sold ?? 0} da ban</p>
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
            title="Đơn hàng gan day"
            actions={
              <button type="button" className={adminStyles.secondaryButton} onClick={() => navigate("/admin/orders")}>
                Xem tat ca
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
                    <th className={adminStyles.th}>Thoi gian</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {recentOrders.length === 0 ? (
                    <tr>
                      <td colSpan={5} className={adminStyles.emptyState}>
                        Chưa có đơn hàng nao.
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
                        <td className={adminStyles.td}>{order.customerName ?? order.customer ?? "-"}</td>
                        <td className={`${adminStyles.td} font-bold text-orange-600`}>
                          {formatCurrency(order.totalAmount ?? order.total)}
                        </td>
                        <td className={adminStyles.td}>
                          <StatusBadge status={order.status} />
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
