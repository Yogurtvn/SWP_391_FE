import { CreditCard, Eye, Loader2, RefreshCw, Search } from "lucide-react";
import { AdminErrorBanner, AdminPageShell, AdminPagination, adminStyles } from "@/components/admin/admin-ui";
import { useAdminPaymentsPage } from "@/hooks/admin/useAdminPaymentsPage";

function normalizeValue(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");
}

function getPaymentMethodLabel(value) {
  return normalizeValue(value) === "payos" ? "PayOS" : "COD";
}

function getPaymentMethodClass(value) {
  return normalizeValue(value) === "payos"
    ? "border-sky-200 bg-sky-50 text-sky-700"
    : "border-amber-200 bg-amber-50 text-amber-700";
}

function getPaymentStatusLabel(value) {
  const normalized = normalizeValue(value);
  if (normalized === "completed") return "Đã thanh toán";
  if (normalized === "failed") return "Thất bại";
  return "Chờ thanh toán";
}

function getPaymentStatusClass(value) {
  const normalized = normalizeValue(value);
  if (normalized === "completed") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (normalized === "failed") return "border-rose-200 bg-rose-50 text-rose-700";
  return "border-amber-200 bg-amber-50 text-amber-700";
}

function formatDateTime(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleString("vi-VN");
}

function formatCurrency(value) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(value || 0));
}

export default function AdminPaymentsPage() {
  const {
    filters,
    payments,
    pageInfo,
    selectedPaymentId,
    paymentDetail,
    paymentHistories,
    ui,
    actions,
    popupElement,
  } = useAdminPaymentsPage();

  return (
    <AdminPageShell
      title="Theo dõi thanh toán"
      actions={
        <button type="button" className={adminStyles.secondaryButton} onClick={actions.retryList} disabled={ui.listLoading}>
          <RefreshCw className={`h-4 w-4 ${ui.listLoading ? "animate-spin" : ""}`} />
          Tải lại
        </button>
      }
    >
      <AdminErrorBanner message={ui.listError} />

      <div className="rounded-[1.8rem] border border-orange-200 bg-white p-5 shadow-[0_12px_28px_rgba(15,23,42,0.06)] md:p-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={filters.orderId}
              onChange={(event) => actions.setFilter("orderId", event.target.value)}
              placeholder="Lọc theo mã đơn hàng"
              className={`${adminStyles.input} pl-12`}
            />
          </label>

          <select
            value={filters.paymentMethod}
            onChange={(event) => actions.setFilter("paymentMethod", event.target.value)}
            className={adminStyles.input}
          >
            <option value="">Tất cả phương thức</option>
            <option value="cod">COD</option>
            <option value="payos">PayOS</option>
          </select>

          <select
            value={filters.paymentStatus}
            onChange={(event) => actions.setFilter("paymentStatus", event.target.value)}
            className={adminStyles.input}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="pending">Chờ thanh toán</option>
            <option value="completed">Đã thanh toán</option>
            <option value="failed">Thất bại</option>
          </select>

          <select
            value={filters.pageSize}
            onChange={(event) => actions.setFilter("pageSize", Number(event.target.value))}
            className={adminStyles.input}
          >
            <option value={10}>10 / trang</option>
            <option value={20}>20 / trang</option>
            <option value={50}>50 / trang</option>
          </select>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <div className={adminStyles.tableWrapper}>
          <table className={adminStyles.table}>
            <thead className={adminStyles.tableHead}>
              <tr>
                <th className={adminStyles.th}>Mã thanh toán</th>
                <th className={adminStyles.th}>Mã đơn hàng</th>
                <th className={adminStyles.th}>Phương thức</th>
                <th className={adminStyles.th}>Trạng thái</th>
                <th className={`${adminStyles.th} text-center`}>Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {ui.listLoading ? (
                <tr>
                  <td colSpan={5} className={adminStyles.emptyState}>
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-orange-500" />
                  </td>
                </tr>
              ) : null}

              {!ui.listLoading && payments.length === 0 ? (
                <tr>
                  <td colSpan={5} className={adminStyles.emptyState}>
                    Không có thanh toán phù hợp.
                  </td>
                </tr>
              ) : null}

              {payments.map((payment) => (
                <tr
                  key={payment.paymentId}
                  className={`transition ${selectedPaymentId === payment.paymentId ? "bg-orange-50/60" : "hover:bg-orange-50/40"}`}
                >
                  <td className={`${adminStyles.td} font-semibold text-[#11284b]`}>#{payment.paymentId}</td>
                  <td className={adminStyles.td}>#{payment.orderId}</td>
                  <td className={adminStyles.td}>
                    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getPaymentMethodClass(payment.paymentMethod)}`}>
                      {getPaymentMethodLabel(payment.paymentMethod)}
                    </span>
                  </td>
                  <td className={adminStyles.td}>
                    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getPaymentStatusClass(payment.paymentStatus)}`}>
                      {getPaymentStatusLabel(payment.paymentStatus)}
                    </span>
                  </td>
                  <td className={`${adminStyles.td} text-center`}>
                    <button
                      type="button"
                      className={`${adminStyles.smallButton} inline-flex h-11 min-w-[110px] items-center justify-center gap-2 whitespace-nowrap`}
                      onClick={() => actions.selectPayment(payment.paymentId)}
                    >
                      <Eye className="h-4 w-4" />
                      Chi tiết
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <AdminPagination
            page={pageInfo.page}
            totalPages={Math.max(1, pageInfo.totalPages)}
            onPageChange={(nextPage) => actions.setFilter("page", nextPage)}
            summary={`Tổng ${pageInfo.totalItems} thanh toán - trang ${pageInfo.page} / ${Math.max(1, pageInfo.totalPages)}`}
          />
        </div>

        <section className="rounded-[1.8rem] border border-orange-200 bg-white p-5 shadow-[0_12px_28px_rgba(15,23,42,0.06)] md:p-6">
          <div className="mb-5 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <h2 className="text-xl font-bold text-[#11284b]">Chi tiết thanh toán</h2>
            <div className="grid w-full gap-2 xl:w-auto">
              {paymentDetail?.orderId ? (
                <button
                  type="button"
                  className={`${adminStyles.smallButton} h-11 w-full justify-center gap-2 whitespace-nowrap`}
                  onClick={() => actions.goToOrder(paymentDetail.orderId)}
                >
                  <CreditCard className="h-4 w-4" />
                  Đơn hàng liên quan
                </button>
              ) : null}
            </div>
          </div>

          {ui.detailError ? (
            <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {ui.detailError}
            </p>
          ) : null}

          {ui.detailLoading ? (
            <div className="py-14 text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-orange-500" />
            </div>
          ) : null}

          {!ui.detailLoading && !paymentDetail ? (
            <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
              Chọn một payment ở bảng bên trái để xem chi tiết.
            </p>
          ) : null}

          {paymentDetail ? (
            <div className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-orange-100 bg-[#fffaf4] p-4">
                  <p className="text-xs font-bold uppercase text-slate-500">Mã thanh toán</p>
                  <p className="mt-2 text-sm font-semibold text-[#11284b]">#{paymentDetail.paymentId}</p>
                </div>
                <div className="rounded-xl border border-orange-100 bg-[#fffaf4] p-4">
                  <p className="text-xs font-bold uppercase text-slate-500">Mã đơn hàng</p>
                  <p className="mt-2 text-sm font-semibold text-[#11284b]">#{paymentDetail.orderId}</p>
                </div>
                <div className="rounded-xl border border-orange-100 bg-[#fffaf4] p-4">
                  <p className="text-xs font-bold uppercase text-slate-500">Phương thức</p>
                  <p className="mt-2 text-sm text-slate-700">{getPaymentMethodLabel(paymentDetail.paymentMethod)}</p>
                </div>
                <div className="rounded-xl border border-orange-100 bg-[#fffaf4] p-4">
                  <p className="text-xs font-bold uppercase text-slate-500">Trạng thái</p>
                  <p className="mt-2 text-sm text-slate-700">{getPaymentStatusLabel(paymentDetail.paymentStatus)}</p>
                </div>
                <div className="rounded-xl border border-orange-100 bg-[#fffaf4] p-4">
                  <p className="text-xs font-bold uppercase text-slate-500">Số tiền</p>
                  <p className="mt-2 text-sm text-slate-700">{formatCurrency(paymentDetail.amount)}</p>
                </div>
                <div className="rounded-xl border border-orange-100 bg-[#fffaf4] p-4">
                  <p className="text-xs font-bold uppercase text-slate-500">Thanh toán lúc</p>
                  <p className="mt-2 text-sm text-slate-700">{formatDateTime(paymentDetail.paidAt)}</p>
                </div>
              </div>

              <div>
                <h3 className="mb-3 text-base font-bold text-[#11284b]">Lịch sử trạng thái thanh toán</h3>
                <ul className="space-y-3">
                  {paymentHistories.length === 0 ? (
                    <li className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                      Không có lịch sử.
                    </li>
                  ) : (
                    paymentHistories.map((history) => (
                      <li key={history.paymentHistoryId} className="rounded-xl border border-orange-100 bg-[#fffaf4] p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getPaymentStatusClass(history.paymentStatus)}`}>
                            {getPaymentStatusLabel(history.paymentStatus)}
                          </span>
                          <span className="text-sm text-slate-500">{formatDateTime(history.createdAt)}</span>
                        </div>
                        {history.transactionCode ? (
                          <p className="mt-2 text-sm font-semibold text-[#11284b]">{history.transactionCode}</p>
                        ) : null}
                      </li>
                    ))
                  )}
                </ul>
              </div>
            </div>
          ) : null}
        </section>
      </div>

      {popupElement}
    </AdminPageShell>
  );
}
