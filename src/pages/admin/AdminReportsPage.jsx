import { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { selectAuthState } from "@/store/auth/authSlice";
import {
  getOrdersSummary,
  getPreOrdersSummary,
  getPrescriptionsSummary,
  getRevenuesSummary,
} from "@/services/adminService";

function DateRangeForm({ value, onChange }) {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      <input
        type="date"
        value={value.startDate}
        onChange={(event) => onChange((current) => ({ ...current, startDate: event.target.value }))}
        className="rounded-md border border-gray-300 px-3 py-2"
      />
      <input
        type="date"
        value={value.endDate}
        onChange={(event) => onChange((current) => ({ ...current, endDate: event.target.value }))}
        className="rounded-md border border-gray-300 px-3 py-2"
      />
      <select
        value={value.groupBy}
        onChange={(event) => onChange((current) => ({ ...current, groupBy: event.target.value }))}
        className="rounded-md border border-gray-300 px-3 py-2"
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
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Báo Cáo</h1>
        <button
          type="button"
          onClick={fetchReports}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold"
        >
          Tải lại
        </button>
      </div>

      <div className="mb-4 rounded-xl border border-gray-200 bg-white p-4">
        <DateRangeForm value={filters} onChange={setFilters} />
      </div>

      {error ? <p className="mb-4 rounded-lg bg-red-50 p-3 text-red-700">{error}</p> : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-gray-200 bg-white p-4">
          <h2 className="mb-2 text-lg font-semibold">Orders Summary</h2>
          <pre className="overflow-auto rounded bg-gray-50 p-3 text-xs">{JSON.stringify(ordersSummary, null, 2)}</pre>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-4">
          <h2 className="mb-2 text-lg font-semibold">Revenues Summary</h2>
          <pre className="overflow-auto rounded bg-gray-50 p-3 text-xs">{JSON.stringify(revenuesSummary, null, 2)}</pre>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-4">
          <h2 className="mb-2 text-lg font-semibold">Prescriptions Summary</h2>
          <pre className="overflow-auto rounded bg-gray-50 p-3 text-xs">{JSON.stringify(prescriptionsSummary, null, 2)}</pre>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-4">
          <h2 className="mb-2 text-lg font-semibold">Pre-Orders Summary</h2>
          <pre className="overflow-auto rounded bg-gray-50 p-3 text-xs">{JSON.stringify(preOrdersSummary, null, 2)}</pre>
        </section>
      </div>

      {loading ? <p className="mt-3 text-sm text-gray-500">Đang tải...</p> : null}
    </div>
  );
}
