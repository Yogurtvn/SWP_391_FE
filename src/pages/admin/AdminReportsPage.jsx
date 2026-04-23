import { useCallback, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AdminErrorBanner, AdminPageShell, AdminSection, adminStyles } from "@/components/admin/admin-ui";
import { selectAuthState } from "@/store/auth/authSlice";
import {
  getOrdersSummary,
  getPreOrdersSummary,
  getPrescriptionsSummary,
  getRevenuesSummary,
} from "@/services/adminService";

const COLORS = ["#df7f00", "#0ea5e9", "#10b981", "#f43f5e", "#8b5cf6", "#f59e0b"];

function formatCurrency(value) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(value || 0));
}

function numberValue(value) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function labelFromKey(key) {
  const labels = {
    totalOrders: "Tổng đơn hàng",
    readyOrders: "Đơn có sẵn",
    preOrderOrders: "Đơn đặt trước",
    prescriptionOrders: "Đơn kính thuốc",
    completedOrders: "Hoàn thành",
    cancelledOrders: "Đã hủy",
    pendingOrders: "Chờ xử lý",
    totalPrescriptions: "Tổng đơn kính",
    pendingPrescriptions: "Đơn kính chờ xử lý",
    completedPrescriptions: "Đơn kính hoàn thành",
    totalPreOrders: "Tổng đơn đặt trước",
    awaitingStockPreOrders: "Chờ hàng",
    completedPreOrders: "Đặt trước hoàn thành",
  };

  return labels[key] || key.replace(/([A-Z])/g, " $1").replace(/^./, (char) => char.toUpperCase());
}

function summaryToChartData(summary) {
  return Object.entries(summary || {})
    .filter(([key, value]) => key !== "items" && typeof value !== "object" && value !== null)
    .map(([key, value]) => ({
      name: labelFromKey(key),
      value: numberValue(value),
    }))
    .filter((item) => item.value > 0);
}

function revenueItems(summary) {
  const items = Array.isArray(summary?.items) ? summary.items : [];

  return items.map((item, index) => ({
    name: item.period || item.date || item.month || item.label || `Mốc ${index + 1}`,
    revenue: numberValue(item.revenue ?? item.totalRevenue ?? item.amount ?? item.totalAmount),
    orders: numberValue(item.orders ?? item.orderCount ?? item.totalOrders),
  }));
}

function totalRevenue(summary) {
  if (summary?.totalRevenue != null) return numberValue(summary.totalRevenue);
  if (summary?.revenue != null) return numberValue(summary.revenue);
  return revenueItems(summary).reduce((sum, item) => sum + item.revenue, 0);
}

function MetricCard({ label, value, tone = "orange" }) {
  const toneClass = {
    orange: "border-orange-200 bg-orange-50 text-orange-700",
    sky: "border-sky-200 bg-sky-50 text-sky-700",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
    rose: "border-rose-200 bg-rose-50 text-rose-700",
  }[tone];

  return (
    <div className={`rounded-[1.4rem] border p-5 ${toneClass}`}>
      <p className="text-sm font-bold">{label}</p>
      <p className="mt-3 text-3xl font-extrabold">{value}</p>
    </div>
  );
}

function EmptyChart() {
  return <div className="flex h-72 items-center justify-center text-sm font-medium text-slate-500">Chưa có dữ liệu.</div>;
}

function DateRangeForm({ value, onChange }) {
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_220px]">
      <input
        type="date"
        value={value.startDate}
        onChange={(event) => onChange((current) => ({ ...current, startDate: event.target.value }))}
        className={adminStyles.input}
      />
      <input
        type="date"
        value={value.endDate}
        onChange={(event) => onChange((current) => ({ ...current, endDate: event.target.value }))}
        className={adminStyles.input}
      />
      <select
        value={value.groupBy}
        onChange={(event) => onChange((current) => ({ ...current, groupBy: event.target.value }))}
        className={adminStyles.input}
      >
        <option value="day">Theo ngày</option>
        <option value="week">Theo tuần</option>
        <option value="month">Theo tháng</option>
      </select>
    </div>
  );
}

export default function AdminReportsPage() {
  const { accessToken } = useSelector(selectAuthState);
  const [filters, setFilters] = useState({ startDate: "", endDate: "", groupBy: "month" });
  const [ordersSummary, setOrdersSummary] = useState(null);
  const [revenuesSummary, setRevenuesSummary] = useState(null);
  const [prescriptionsSummary, setPrescriptionsSummary] = useState(null);
  const [preOrdersSummary, setPreOrdersSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchReports = useCallback(async () => {
    if (!accessToken) {
      setError("Không có access token.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const params = {
        startDate: filters.startDate ? new Date(filters.startDate).toISOString() : undefined,
        endDate: filters.endDate ? new Date(filters.endDate).toISOString() : undefined,
      };

      const [orders, revenues, prescriptions, preOrders] = await Promise.all([
        getOrdersSummary(params, accessToken),
        getRevenuesSummary({ ...params, groupBy: filters.groupBy }, accessToken),
        getPrescriptionsSummary(params, accessToken),
        getPreOrdersSummary(params, accessToken),
      ]);

      setOrdersSummary(orders);
      setRevenuesSummary(revenues);
      setPrescriptionsSummary(prescriptions);
      setPreOrdersSummary(preOrders);
    } catch (requestError) {
      setError(requestError?.message || "Không tải được báo cáo.");
    } finally {
      setLoading(false);
    }
  }, [accessToken, filters.endDate, filters.groupBy, filters.startDate]);

  useEffect(() => {
    void fetchReports();
  }, [fetchReports]);

  const orderChartData = useMemo(() => summaryToChartData(ordersSummary), [ordersSummary]);
  const prescriptionChartData = useMemo(() => summaryToChartData(prescriptionsSummary), [prescriptionsSummary]);
  const preOrderChartData = useMemo(() => summaryToChartData(preOrdersSummary), [preOrdersSummary]);
  const revenueChartData = useMemo(() => revenueItems(revenuesSummary), [revenuesSummary]);

  return (
    <AdminPageShell
      title="Báo Cáo"
      actions={
        <button type="button" onClick={fetchReports} className={adminStyles.secondaryButton} disabled={loading}>
          {loading ? "Đang tải..." : "Tải lại"}
        </button>
      }
    >
      <AdminSection>
        <DateRangeForm value={filters} onChange={setFilters} />
      </AdminSection>

      <AdminErrorBanner message={error} />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Tổng đơn hàng" value={numberValue(ordersSummary?.totalOrders)} />
        <MetricCard label="Doanh thu" value={formatCurrency(totalRevenue(revenuesSummary))} tone="emerald" />
        <MetricCard label="Đơn kính thuốc" value={numberValue(prescriptionsSummary?.totalPrescriptions)} tone="sky" />
        <MetricCard label="Đơn đặt trước" value={numberValue(preOrdersSummary?.totalPreOrders)} tone="rose" />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <AdminSection title="Doanh thu theo thời gian">
          {revenueChartData.length ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#fed7aa" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => `${Math.round(value / 1000)}k`} />
                  <Tooltip formatter={(value, name) => (name === "revenue" ? formatCurrency(value) : value)} />
                  <Line type="monotone" dataKey="revenue" name="Doanh thu" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyChart />
          )}
        </AdminSection>

        <AdminSection title="Tổng quan đơn hàng">
          {orderChartData.length ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={orderChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#fed7aa" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="value" name="Số lượng" radius={[8, 8, 0, 0]} fill="#df7f00" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyChart />
          )}
        </AdminSection>

        <AdminSection title="Đơn kính thuốc">
          {prescriptionChartData.length ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={prescriptionChartData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={95} paddingAngle={3}>
                    {prescriptionChartData.map((entry, index) => (
                      <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyChart />
          )}
        </AdminSection>

        <AdminSection title="Đơn đặt trước">
          {preOrderChartData.length ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={preOrderChartData} layout="vertical" margin={{ left: 28 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#fed7aa" />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={130} />
                  <Tooltip />
                  <Bar dataKey="value" name="Số lượng" radius={[0, 8, 8, 0]} fill="#f43f5e" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyChart />
          )}
        </AdminSection>
      </div>
    </AdminPageShell>
  );
}
