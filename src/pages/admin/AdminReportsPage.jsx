import { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { AdminErrorBanner, AdminPageShell, AdminSection, adminStyles } from "@/components/admin/admin-ui";
import { selectAuthState } from "@/store/auth/authSlice";
import {
  getOrdersSummary,
  getPreOrdersSummary,
  getPrescriptionsSummary,
  getRevenuesSummary,
} from "@/services/adminService";

function DateRangeForm({ value, onChange }) {
  return (
    <div className={adminStyles.toolbarGrid}>
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
        <option value="day">day</option>
        <option value="week">week</option>
        <option value="month">month</option>
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
    fetchReports();
  }, [fetchReports]);

  return (
    <AdminPageShell
      title="Báo Cáo"
      actions={
        <button type="button" onClick={fetchReports} className={adminStyles.secondaryButton}>
          Tải lại
        </button>
      }
    >
      <AdminSection>
        <DateRangeForm value={filters} onChange={setFilters} />
      </AdminSection>

      <AdminErrorBanner message={error} />

      <div className="grid gap-6 xl:grid-cols-2">
        <AdminSection title="Orders Summary">
          <pre className={adminStyles.prePanel}>{JSON.stringify(ordersSummary, null, 2)}</pre>
        </AdminSection>

        <AdminSection title="Revenues Summary">
          <pre className={adminStyles.prePanel}>{JSON.stringify(revenuesSummary, null, 2)}</pre>
        </AdminSection>

        <AdminSection title="Prescriptions Summary">
          <pre className={adminStyles.prePanel}>{JSON.stringify(prescriptionsSummary, null, 2)}</pre>
        </AdminSection>

        <AdminSection title="Pre-Orders Summary">
          <pre className={adminStyles.prePanel}>{JSON.stringify(preOrdersSummary, null, 2)}</pre>
        </AdminSection>
      </div>

      {loading ? <p className="text-sm font-medium text-slate-500">Đang tải...</p> : null}
    </AdminPageShell>
  );
}
