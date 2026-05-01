import { AdminErrorBanner, adminStyles } from "@/components/admin/admin-ui";
import { useAdminOrderDetailPage } from "@/hooks/admin/useAdminOrderDetailPage";
import { getOrderStatusPresentation, getShippingStatusPresentation } from "@/utils/orderStatus";
import { getAllowedAdminOrderTransitions } from "@/utils/orderWorkflowPolicy";

function formatCurrency(value) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(value || 0));
}

function formatDateTime(value) {
  if (!value) {
    return "";
  }

  const rawValue = String(value ?? "").trim();
  const noTimezoneIsoPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?$/;
  const normalizedValue = noTimezoneIsoPattern.test(rawValue) ? `${rawValue}Z` : rawValue;
  const date = value instanceof Date ? value : new Date(normalizedValue);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour12: false,
  }).format(date);
}

function hasValue(value) {
  return value !== null && value !== undefined && String(value).trim() !== "" && String(value).trim() !== "-";
}

function translateNote(note) {
  const normalized = String(note || "").trim().toLowerCase();

  if (normalized === "order created." || normalized === "order created") return "Đơn hàng đã được tạo.";
  if (normalized === "payment created." || normalized === "payment created") return "Thanh toán đã được tạo.";
  if (normalized === "payos payment initialized." || normalized === "payos payment initialized") {
    return "Thanh toán PayOS đã được khởi tạo.";
  }
  if (
    normalized === "payos reconcile marked payment as failed after return."
    || normalized === "payos reconcile marked payment as failed after return"
  ) {
    return "PayOS đối soát và đánh dấu thanh toán thất bại sau khi quay về.";
  }
  if (
    normalized === "order cancelled automatically because online payment failed (payment:reconcile)."
    || normalized === "order cancelled automatically because online payment failed (payment:reconcile)"
  ) {
    return "Đơn hàng đã tự động hủy do thanh toán online thất bại (payment:reconcile).";
  }
  if (normalized === "order is being processed." || normalized === "order is being processed") return "Đơn hàng đang được xử lý.";
  if (normalized === "order shipped." || normalized === "order shipped") return "Đơn hàng đã được giao cho đơn vị vận chuyển.";
  if (normalized === "order completed." || normalized === "order completed") return "Đơn hàng đã hoàn thành.";
  if (normalized === "order moved to awaiting stock." || normalized === "order moved to awaiting stock") {
    return "Đơn hàng đã chuyển sang trạng thái chờ hàng.";
  }
  if (
    normalized === "order moved to processing automatically after stock receipt and basic-stock email."
    || normalized === "order moved to processing automatically after stock receipt and basic-stock email"
    || normalized === "order moved to processing automatically after stock receipt and basic stock email."
    || normalized === "order moved to processing automatically after stock receipt and basic stock email"
    || normalized === "order moved to processing automatically after stock receipt and back-in-stock email."
    || normalized === "order moved to processing automatically after stock receipt and back-in-stock email"
    || normalized === "order moved to processing automatically after stock receipt and back in stock email."
    || normalized === "order moved to processing automatically after stock receipt and back in stock email"
  ) {
    return "Đơn hàng đã tự động chuyển sang đang xử lý sau khi nhập kho và gửi email thông báo có hàng.";
  }
  if (normalized === "payment collected when the order was completed." || normalized === "payment collected when the order was completed") {
    return "Đã thu tiền khi đơn hàng hoàn thành.";
  }
  if (normalized === "updated by admin") return "Quản trị viên đã cập nhật.";
  return note;
}

function getPaymentStatusLabel(value) {
  const normalized = String(value || "").trim().toLowerCase();

  if (normalized === "completed") return "Đã thanh toán";
  if (normalized === "failed") return "Thanh toán thất bại";
  if (normalized === "pending") return "Chờ thanh toán";
  return value || "-";
}

function getPillClass(value, type = "default") {
  const normalized = String(value || "").toLowerCase();

  if (type === "shipping") {
    if (["pending", "processing", "packed"].includes(normalized)) {
      return "border-yellow-200 bg-yellow-50 text-yellow-700";
    }

    if (["shipping", "in-transit", "delivered", "completed"].includes(normalized)) {
      return "border-green-200 bg-green-50 text-green-700";
    }

    if (["cancelled", "failed"].includes(normalized)) {
      return "border-red-200 bg-red-50 text-red-700";
    }
  }

  if (["ready", "confirmed", "approved", "paid", "active", "completed"].includes(normalized)) {
    return "border-green-200 bg-green-50 text-green-700";
  }

  if (["pending", "reviewing", "awaiting-stock", "processing"].includes(normalized)) {
    return "border-yellow-200 bg-yellow-50 text-yellow-700";
  }

  if (["cancelled", "rejected", "failed"].includes(normalized)) {
    return "border-red-200 bg-red-50 text-red-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-600";
}

function StatusPill({ value, type }) {
  if (!hasValue(value)) {
    return null;
  }

  if (type === "order") {
    const presentation = getOrderStatusPresentation(value);

    return (
      <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${presentation.className}`}>
        {presentation.label}
      </span>
    );
  }

  if (type === "shipping") {
    const presentation = getShippingStatusPresentation(value);

    return (
      <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${presentation.className}`}>
        {presentation.label}
      </span>
    );
  }

  if (type === "payment") {
    return (
      <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getPillClass(value)}`}>
        {getPaymentStatusLabel(value)}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold capitalize ${getPillClass(value, type)}`}
    >
      {value || "-"}
    </span>
  );
}

function DetailField({ label, value, emphasize = false, children }) {
  if (!children && !hasValue(value)) {
    return null;
  }

  return (
    <div className="rounded-[1.35rem] border border-orange-100 bg-[#fffaf4] p-4">
      <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#7a8ba5]">{label}</p>
      {children ? (
        <div className="mt-2">{children}</div>
      ) : (
        <p className={`mt-2 text-sm ${emphasize ? "font-bold text-[#11284b]" : "text-slate-700"}`}>{value}</p>
      )}
    </div>
  );
}

export default function AdminOrderDetailPage() {
  const { orderId, order, ui, actions, popupElement } = useAdminOrderDetailPage();
  const canUpdateOrderStatus = order ? getAllowedAdminOrderTransitions(order).length > 0 : false;

  return (
    <div className={adminStyles.page}>
      <div className={adminStyles.container}>
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-3">
            <button
              type="button"
              onClick={actions.backToOrders}
              className="inline-flex items-center rounded-full border border-orange-200 bg-white px-4 py-2 text-sm font-semibold text-[#df7f00] shadow-[0_8px_18px_rgba(223,127,0,0.08)] transition hover:bg-orange-50"
            >
              &lt; Quay lại danh sách đơn
            </button>
            <div>
              <h1 className="text-[2.2rem] font-bold tracking-tight text-[#11284b]">Chi tiết đơn hàng #{orderId}</h1>
              <p className="mt-2 text-sm font-medium text-slate-500">
                Theo dõi thông tin giao hàng, thanh toán và lịch sử xử lý của đơn hàng.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={actions.retry} className={adminStyles.secondaryButton}>
              Tải lại
            </button>
            <button
              type="button"
              onClick={actions.updateOrderStatus}
              disabled={!order || !canUpdateOrderStatus}
              className={adminStyles.secondaryButton}
            >
              Đổi trạng thái đơn
            </button>
          </div>
        </div>

        <AdminErrorBanner message={ui.error} />
        {ui.isLoading ? <p className="text-sm font-medium text-slate-500">Đang tải...</p> : null}

        {order ? (
          <div className="space-y-6">
            <section className="rounded-[1.8rem] border border-orange-200 bg-white p-5 shadow-[0_12px_28px_rgba(15,23,42,0.06)] md:p-6">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {hasValue(order.orderType) ? <DetailField label="Loại đơn">
                  <StatusPill value={order.orderType} />
                </DetailField> : null}
                {hasValue(order.orderStatus) ? <DetailField label="Trạng thái đơn">
                  <StatusPill value={order.orderStatus} type="order" />
                </DetailField> : null}
                <DetailField label="Tổng tiền" value={formatCurrency(order.totalAmount)} emphasize />
                <DetailField label="Người nhận" value={order.receiverName} />
                <DetailField label="Số điện thoại" value={order.receiverPhone} />
                <DetailField label="Email" value={order.receiverEmail || order.email || order.customerEmail} />
                <DetailField label="Địa chỉ" value={order.shippingAddress} />
                <DetailField label="Mã vận đơn" value={order.shippingCode} />
                <DetailField label="Dự kiến giao" value={formatDateTime(order.expectedDeliveryDate)} />
                <DetailField label="Ghi chú giao hàng" value={order.shippingNote || order.note} />
                <DetailField label="Ngày tạo" value={formatDateTime(order.createdAt)} />
                <DetailField label="Cập nhật" value={formatDateTime(order.updatedAt)} />
              </div>
            </section>

            <section className="overflow-hidden rounded-[1.8rem] border border-orange-200 bg-white shadow-[0_12px_28px_rgba(15,23,42,0.06)]">
              <div className="border-b border-orange-100 px-5 py-5 md:px-6">
                <h2 className="text-xl font-bold text-[#11284b]">Sản phẩm trong đơn</h2>
              </div>
              <div className="overflow-x-auto">
                <table className={adminStyles.table}>
                  <thead className={adminStyles.tableHead}>
                    <tr>
                      <th className={adminStyles.th}>Sản phẩm</th>
                      <th className={adminStyles.th}>SKU</th>
                      <th className={adminStyles.th}>Màu</th>
                      <th className={adminStyles.th}>SL</th>
                      <th className={adminStyles.th}>Đơn giá</th>
                      <th className={adminStyles.th}>Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-orange-100">
                    {(order.items ?? []).length === 0 ? (
                      <tr>
                        <td colSpan={6} className={adminStyles.emptyState}>
                          Không có dữ liệu.
                        </td>
                      </tr>
                    ) : (
                      (order.items ?? []).map((item) => (
                        <tr key={item.orderItemId}>
                          <td className={`${adminStyles.td} font-semibold text-[#11284b]`}>{item.productName || "-"}</td>
                          <td className={adminStyles.td}>{item.sku || "-"}</td>
                          <td className={adminStyles.td}>{item.selectedColor || item.variantColor || "-"}</td>
                          <td className={adminStyles.td}>{item.quantity ?? 0}</td>
                          <td className={adminStyles.td}>{formatCurrency(item.unitPrice)}</td>
                          <td className={`${adminStyles.td} font-semibold text-[#df7f00]`}>
                            {formatCurrency(item.lineTotal ?? item.totalPrice)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <div className="grid gap-6 lg:grid-cols-2">
              <section className="rounded-[1.8rem] border border-orange-200 bg-white p-5 shadow-[0_12px_28px_rgba(15,23,42,0.06)] md:p-6">
                <h2 className="mb-4 text-xl font-bold text-[#11284b]">Thanh toán</h2>
                {order.payment ? (
                  <div className="space-y-4 text-sm text-slate-700">
                    <div className="grid gap-4 md:grid-cols-2">
                      <DetailField label="Phương thức" value={order.payment.paymentMethod} />
                      {hasValue(order.payment.paymentStatus) ? <DetailField label="Trạng thái">
                        <StatusPill value={order.payment.paymentStatus} type="payment" />
                      </DetailField> : null}
                      <DetailField label="Số tiền" value={formatCurrency(order.payment.amount)} emphasize />
                      <DetailField label="Đã thanh toán lúc" value={formatDateTime(order.payment.paidAt)} />
                      <DetailField label="Mã giao dịch" value={order.payment.transactionCode || order.payment.payosOrderCode} />
                    </div>

                    <div className="pt-2">
                      <h3 className="mb-3 text-base font-bold text-[#11284b]">Lịch sử thanh toán</h3>
                      <ul className="space-y-3">
                        {(order.payment.histories ?? []).length === 0 ? (
                          <li className="rounded-[1.2rem] border border-orange-100 bg-[#fffaf4] px-4 py-3 text-sm text-slate-500">
                            Không có dữ liệu.
                          </li>
                        ) : (
                          (order.payment.histories ?? []).map((history) => (
                            <li
                              key={history.paymentHistoryId}
                              className="rounded-[1.2rem] border border-orange-100 bg-[#fffaf4] p-4"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-3">
                                <StatusPill value={history.paymentStatus} type="payment" />
                                <p className="text-sm text-slate-500">{formatDateTime(history.createdAt)}</p>
                              </div>
                              {hasValue(history.transactionCode) ? (
                                <p className="mt-3 text-sm font-semibold text-[#11284b]">{history.transactionCode}</p>
                              ) : null}
                              {history.notes ? <p className="mt-1 text-sm text-slate-600">{translateNote(history.notes)}</p> : null}
                            </li>
                          ))
                        )}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <p className="rounded-[1.2rem] border border-orange-100 bg-[#fffaf4] px-4 py-4 text-sm text-slate-500">
                    Không có thông tin thanh toán.
                  </p>
                )}
              </section>

              <section className="rounded-[1.8rem] border border-orange-200 bg-white p-5 shadow-[0_12px_28px_rgba(15,23,42,0.06)] md:p-6">
                <h2 className="mb-4 text-xl font-bold text-[#11284b]">Lịch sử trạng thái</h2>
                <ul className="space-y-3">
                  {(order.statusHistory ?? []).length === 0 ? (
                    <li className="rounded-[1.2rem] border border-orange-100 bg-[#fffaf4] px-4 py-3 text-sm text-slate-500">
                      Không có dữ liệu.
                    </li>
                  ) : (
                    (order.statusHistory ?? []).map((history) => (
                      <li key={history.historyId} className="rounded-[1.2rem] border border-orange-100 bg-[#fffaf4] p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <StatusPill value={history.orderStatus} type="order" />
                          <p className="text-sm text-slate-500">{formatDateTime(history.updatedAt)}</p>
                        </div>
                        <p className="mt-3 text-sm font-semibold text-[#11284b]">
                          {history.updatedByName || `User #${history.updatedByUserId ?? "-"}`}
                        </p>
                        {history.note ? <p className="mt-1 text-sm text-slate-600">{translateNote(history.note)}</p> : null}
                      </li>
                    ))
                  )}
                </ul>
              </section>
            </div>
          </div>
        ) : null}

        {popupElement}
      </div>
    </div>
  );
}
