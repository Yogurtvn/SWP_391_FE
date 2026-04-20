import { AdminErrorBanner, adminStyles } from "@/components/admin/admin-ui";
import { useAdminOrderDetailPage } from "@/hooks/admin/useAdminOrderDetailPage";

function formatCurrency(value) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(value || 0));
}

function formatDateTime(value) {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleString("vi-VN");
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
  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold capitalize ${getPillClass(value, type)}`}
    >
      {value || "-"}
    </span>
  );
}

function DetailField({ label, value, emphasize = false, children }) {
  return (
    <div className="rounded-[1.35rem] border border-orange-100 bg-[#fffaf4] p-4">
      <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#7a8ba5]">{label}</p>
      {children ? (
        <div className="mt-2">{children}</div>
      ) : (
        <p className={`mt-2 text-sm ${emphasize ? "font-bold text-[#11284b]" : "text-slate-700"}`}>{value || "-"}</p>
      )}
    </div>
  );
}

export default function AdminOrderDetailPage() {
  const { orderId, order, ui, actions, popupElement } = useAdminOrderDetailPage();

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
              &lt; Quay lai danh sach don
            </button>
            <div>
              <h1 className="text-[2.2rem] font-bold tracking-tight text-[#11284b]">Chi tiet don hang #{orderId}</h1>
              <p className="mt-2 text-sm font-medium text-slate-500">
                Theo doi thong tin giao hang, thanh toan va lich su xu ly cua don hang.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={actions.retry} className={adminStyles.secondaryButton}>
              Tai lai
            </button>
            <button
              type="button"
              onClick={actions.updateOrderStatus}
              disabled={!order}
              className={adminStyles.secondaryButton}
            >
              Doi trang thai don
            </button>
            <button
              type="button"
              onClick={actions.updateShippingStatus}
              disabled={!order}
              className={adminStyles.secondaryButton}
            >
              Doi van chuyen
            </button>
          </div>
        </div>

        <AdminErrorBanner message={ui.error} />
        {ui.isLoading ? <p className="text-sm font-medium text-slate-500">Dang tai...</p> : null}

        {order ? (
          <div className="space-y-6">
            <section className="rounded-[1.8rem] border border-orange-200 bg-white p-5 shadow-[0_12px_28px_rgba(15,23,42,0.06)] md:p-6">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <DetailField label="Loai don">
                  <StatusPill value={order.orderType} />
                </DetailField>
                <DetailField label="Trang thai don">
                  <StatusPill value={order.orderStatus} />
                </DetailField>
                <DetailField label="Van chuyen">
                  <StatusPill value={order.shippingStatus} type="shipping" />
                </DetailField>
                <DetailField label="Tong tien" value={formatCurrency(order.totalAmount)} emphasize />
                <DetailField label="Nguoi nhan" value={order.receiverName} />
                <DetailField label="So dien thoai" value={order.receiverPhone} />
                <DetailField label="Dia chi" value={order.shippingAddress} />
                <DetailField label="Ma van don" value={order.shippingCode} />
                <DetailField label="Du kien giao" value={formatDateTime(order.expectedDeliveryDate)} />
                <DetailField label="Ngay tao" value={formatDateTime(order.createdAt)} />
                <DetailField label="Cap nhat" value={formatDateTime(order.updatedAt)} />
              </div>
            </section>

            <section className="overflow-hidden rounded-[1.8rem] border border-orange-200 bg-white shadow-[0_12px_28px_rgba(15,23,42,0.06)]">
              <div className="border-b border-orange-100 px-5 py-5 md:px-6">
                <h2 className="text-xl font-bold text-[#11284b]">San pham trong don</h2>
              </div>
              <div className="overflow-x-auto">
                <table className={adminStyles.table}>
                  <thead className={adminStyles.tableHead}>
                    <tr>
                      <th className={adminStyles.th}>San pham</th>
                      <th className={adminStyles.th}>SKU</th>
                      <th className={adminStyles.th}>Mau</th>
                      <th className={adminStyles.th}>SL</th>
                      <th className={adminStyles.th}>Don gia</th>
                      <th className={adminStyles.th}>Thanh tien</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-orange-100">
                    {(order.items ?? []).length === 0 ? (
                      <tr>
                        <td colSpan={6} className={adminStyles.emptyState}>
                          Khong co du lieu.
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
                <h2 className="mb-4 text-xl font-bold text-[#11284b]">Thanh toan</h2>
                {order.payment ? (
                  <div className="space-y-4 text-sm text-slate-700">
                    <div className="grid gap-4 md:grid-cols-2">
                      <DetailField label="Phuong thuc" value={order.payment.paymentMethod} />
                      <DetailField label="Trang thai">
                        <StatusPill value={order.payment.paymentStatus} />
                      </DetailField>
                      <DetailField label="So tien" value={formatCurrency(order.payment.amount)} emphasize />
                      <DetailField label="Da thanh toan luc" value={formatDateTime(order.payment.paidAt)} />
                    </div>

                    <div className="pt-2">
                      <h3 className="mb-3 text-base font-bold text-[#11284b]">Lich su thanh toan</h3>
                      <ul className="space-y-3">
                        {(order.payment.histories ?? []).length === 0 ? (
                          <li className="rounded-[1.2rem] border border-orange-100 bg-[#fffaf4] px-4 py-3 text-sm text-slate-500">
                            Khong co du lieu.
                          </li>
                        ) : (
                          (order.payment.histories ?? []).map((history) => (
                            <li
                              key={history.paymentHistoryId}
                              className="rounded-[1.2rem] border border-orange-100 bg-[#fffaf4] p-4"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-3">
                                <StatusPill value={history.paymentStatus} />
                                <p className="text-sm text-slate-500">{formatDateTime(history.createdAt)}</p>
                              </div>
                              <p className="mt-3 text-sm font-semibold text-[#11284b]">{history.transactionCode || "-"}</p>
                              {history.notes ? <p className="mt-1 text-sm text-slate-600">{history.notes}</p> : null}
                            </li>
                          ))
                        )}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <p className="rounded-[1.2rem] border border-orange-100 bg-[#fffaf4] px-4 py-4 text-sm text-slate-500">
                    Khong co thong tin thanh toan.
                  </p>
                )}
              </section>

              <section className="rounded-[1.8rem] border border-orange-200 bg-white p-5 shadow-[0_12px_28px_rgba(15,23,42,0.06)] md:p-6">
                <h2 className="mb-4 text-xl font-bold text-[#11284b]">Lich su trang thai</h2>
                <ul className="space-y-3">
                  {(order.statusHistory ?? []).length === 0 ? (
                    <li className="rounded-[1.2rem] border border-orange-100 bg-[#fffaf4] px-4 py-3 text-sm text-slate-500">
                      Khong co du lieu.
                    </li>
                  ) : (
                    (order.statusHistory ?? []).map((history) => (
                      <li key={history.historyId} className="rounded-[1.2rem] border border-orange-100 bg-[#fffaf4] p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <StatusPill value={history.orderStatus} />
                          <p className="text-sm text-slate-500">{formatDateTime(history.updatedAt)}</p>
                        </div>
                        <p className="mt-3 text-sm font-semibold text-[#11284b]">
                          {history.updatedByName || `User #${history.updatedByUserId ?? "-"}`}
                        </p>
                        {history.note ? <p className="mt-1 text-sm text-slate-600">{history.note}</p> : null}
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
