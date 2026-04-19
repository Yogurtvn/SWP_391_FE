import { ADMIN_ORDER_STATUSES, ADMIN_SHIPPING_STATUSES, useAdminOrdersPage } from "@/hooks/admin/useAdminOrdersPage";

function formatCurrency(value) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(value || 0));
}

export default function AdminOrdersPage() {
  const { orders, filters, pageInfo, ui, actions, popupElement } = useAdminOrdersPage();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Quan Ly Don Hang</h1>
        <button
          type="button"
          onClick={actions.retry}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold"
        >
          Tai lai
        </button>
      </div>

      {ui.error ? <p className="mb-4 rounded-lg bg-red-50 p-3 text-red-700">{ui.error}</p> : null}

      <div className="mb-4 grid gap-3 rounded-xl border border-gray-200 bg-white p-4 md:grid-cols-3">
        <input
          type="text"
          name="search"
          value={filters.search}
          onChange={(event) => actions.setFilter("search", event.target.value)}
          placeholder="Tim theo ma don, nguoi nhan..."
          className="rounded-md border border-gray-300 px-3 py-2"
        />
        <select
          name="orderStatus"
          value={filters.orderStatus}
          onChange={(event) => actions.setFilter("orderStatus", event.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2"
        >
          <option value="">Tat ca trang thai don</option>
          {ADMIN_ORDER_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
        <select
          name="shippingStatus"
          value={filters.shippingStatus}
          onChange={(event) => actions.setFilter("shippingStatus", event.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2"
        >
          <option value="">Tat ca trang thai van chuyen</option>
          {ADMIN_SHIPPING_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-600">Ma don</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-600">Nguoi nhan</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-600">Loai</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-600">Trang thai</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-600">Van chuyen</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-600">Tong tien</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-600">Thao tac</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {!ui.isLoading && orders.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-sm text-gray-500">
                  Khong co du lieu.
                </td>
              </tr>
            ) : null}

            {orders.map((order) => (
              <tr key={order.orderId}>
                <td className="px-4 py-3 text-sm font-semibold text-gray-900">#{order.orderId}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{order.receiverName || "-"}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{order.orderType || "-"}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{order.orderStatus || "-"}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{order.shippingStatus || "-"}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{formatCurrency(order.totalAmount)}</td>
                <td className="px-4 py-3 text-sm">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => actions.goToDetail(order.orderId)}
                      className="rounded-md border border-gray-300 px-2 py-1 text-xs font-semibold"
                    >
                      Chi tiet
                    </button>
                    <button
                      type="button"
                      onClick={() => actions.updateOrderStatus(order.orderId)}
                      className="rounded-md border border-gray-300 px-2 py-1 text-xs font-semibold"
                    >
                      Doi trang thai don
                    </button>
                    <button
                      type="button"
                      onClick={() => actions.updateShippingStatus(order.orderId)}
                      className="rounded-md border border-gray-300 px-2 py-1 text-xs font-semibold"
                    >
                      Doi van chuyen
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-end gap-2">
        <button
          type="button"
          disabled={filters.page <= 1}
          onClick={() => actions.setFilter("page", Math.max(1, filters.page - 1))}
          className="rounded-md border border-gray-300 px-3 py-1 text-sm disabled:opacity-50"
        >
          Truoc
        </button>
        <span className="text-sm text-gray-700">
          Trang {filters.page}/{pageInfo.totalPages || 1}
        </span>
        <button
          type="button"
          disabled={filters.page >= (pageInfo.totalPages || 1)}
          onClick={() => actions.setFilter("page", Math.min(pageInfo.totalPages || 1, filters.page + 1))}
          className="rounded-md border border-gray-300 px-3 py-1 text-sm disabled:opacity-50"
        >
          Sau
        </button>
      </div>
      {popupElement}
    </div>
  );
}
