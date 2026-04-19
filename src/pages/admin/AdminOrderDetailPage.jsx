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

export default function AdminOrderDetailPage() {
  const { orderId, order, ui, actions, popupElement } = useAdminOrderDetailPage();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <button
            type="button"
            onClick={actions.backToOrders}
            className="mb-2 text-sm font-semibold text-primary hover:underline"
          >
            ← Quay lai danh sach don
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Chi tiet don hang #{orderId}</h1>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={actions.retry}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold"
          >
            Tai lai
          </button>
          <button
            type="button"
            onClick={actions.updateOrderStatus}
            disabled={!order}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold disabled:opacity-50"
          >
            Doi trang thai don
          </button>
          <button
            type="button"
            onClick={actions.updateShippingStatus}
            disabled={!order}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold disabled:opacity-50"
          >
            Doi van chuyen
          </button>
        </div>
      </div>

      {ui.error ? <p className="mb-4 rounded-lg bg-red-50 p-3 text-red-700">{ui.error}</p> : null}
      {ui.isLoading ? <p className="text-sm text-gray-500">Dang tai...</p> : null}

      {order ? (
        <div className="space-y-6">
          <section className="grid gap-4 rounded-xl border border-gray-200 bg-white p-4 md:grid-cols-2 xl:grid-cols-4">
            <div>
              <p className="text-xs font-bold uppercase text-gray-500">Loai don</p>
              <p className="mt-1 text-sm text-gray-900">{order.orderType || "-"}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-gray-500">Trang thai</p>
              <p className="mt-1 text-sm text-gray-900">{order.orderStatus || "-"}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-gray-500">Van chuyen</p>
              <p className="mt-1 text-sm text-gray-900">{order.shippingStatus || "-"}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-gray-500">Tong tien</p>
              <p className="mt-1 text-sm font-semibold text-gray-900">{formatCurrency(order.totalAmount)}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-gray-500">Nguoi nhan</p>
              <p className="mt-1 text-sm text-gray-900">{order.receiverName || "-"}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-gray-500">So dien thoai</p>
              <p className="mt-1 text-sm text-gray-900">{order.receiverPhone || "-"}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-xs font-bold uppercase text-gray-500">Dia chi</p>
              <p className="mt-1 text-sm text-gray-900">{order.shippingAddress || "-"}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-gray-500">Ma van don</p>
              <p className="mt-1 text-sm text-gray-900">{order.shippingCode || "-"}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-gray-500">Du kien giao</p>
              <p className="mt-1 text-sm text-gray-900">{formatDateTime(order.expectedDeliveryDate)}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-gray-500">Ngay tao</p>
              <p className="mt-1 text-sm text-gray-900">{formatDateTime(order.createdAt)}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-gray-500">Cap nhat</p>
              <p className="mt-1 text-sm text-gray-900">{formatDateTime(order.updatedAt)}</p>
            </div>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-4">
            <h2 className="mb-3 text-lg font-semibold text-gray-900">San pham trong don</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-600">San pham</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-600">SKU</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-600">Mau</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-600">SL</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-600">Don gia</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-600">Thanh tien</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(order.items ?? []).length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-6 text-center text-sm text-gray-500">
                        Khong co du lieu.
                      </td>
                    </tr>
                  ) : (
                    (order.items ?? []).map((item) => (
                      <tr key={item.orderItemId}>
                        <td className="px-4 py-3 text-sm font-semibold text-gray-900">{item.productName || "-"}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{item.sku || "-"}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{item.selectedColor || item.variantColor || "-"}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{item.quantity ?? 0}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{formatCurrency(item.unitPrice)}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{formatCurrency(item.lineTotal ?? item.totalPrice)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-xl border border-gray-200 bg-white p-4">
              <h2 className="mb-3 text-lg font-semibold text-gray-900">Thanh toan</h2>
              {order.payment ? (
                <div className="space-y-2 text-sm text-gray-700">
                  <p><span className="font-semibold text-gray-900">Phuong thuc:</span> {order.payment.paymentMethod || "-"}</p>
                  <p><span className="font-semibold text-gray-900">Trang thai:</span> {order.payment.paymentStatus || "-"}</p>
                  <p><span className="font-semibold text-gray-900">So tien:</span> {formatCurrency(order.payment.amount)}</p>
                  <p><span className="font-semibold text-gray-900">Da thanh toan luc:</span> {formatDateTime(order.payment.paidAt)}</p>

                  <div className="pt-2">
                    <h3 className="mb-2 font-semibold text-gray-900">Lich su thanh toan</h3>
                    <ul className="space-y-2">
                      {(order.payment.histories ?? []).length === 0 ? (
                        <li className="text-sm text-gray-500">Khong co du lieu.</li>
                      ) : (
                        (order.payment.histories ?? []).map((history) => (
                          <li key={history.paymentHistoryId} className="rounded-lg bg-gray-50 p-3">
                            <p className="font-medium text-gray-900">{history.paymentStatus || "-"}</p>
                            <p className="text-gray-700">{history.transactionCode || "-"}</p>
                            <p className="text-gray-500">{formatDateTime(history.createdAt)}</p>
                            {history.notes ? <p className="mt-1 text-gray-600">{history.notes}</p> : null}
                          </li>
                        ))
                      )}
                    </ul>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500">Khong co thong tin thanh toan.</p>
              )}
            </section>

            <section className="rounded-xl border border-gray-200 bg-white p-4">
              <h2 className="mb-3 text-lg font-semibold text-gray-900">Lich su trang thai</h2>
              <ul className="space-y-2">
                {(order.statusHistory ?? []).length === 0 ? (
                  <li className="text-sm text-gray-500">Khong co du lieu.</li>
                ) : (
                  (order.statusHistory ?? []).map((history) => (
                    <li key={history.historyId} className="rounded-lg bg-gray-50 p-3">
                      <p className="font-medium text-gray-900">{history.orderStatus || "-"}</p>
                      <p className="text-sm text-gray-600">{history.updatedByName || `User #${history.updatedByUserId ?? "-"}`}</p>
                      <p className="text-sm text-gray-500">{formatDateTime(history.updatedAt)}</p>
                      {history.note ? <p className="mt-1 text-sm text-gray-700">{history.note}</p> : null}
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
  );
}
