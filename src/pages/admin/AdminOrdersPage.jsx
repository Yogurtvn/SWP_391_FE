import { ADMIN_ORDER_STATUSES, ADMIN_SHIPPING_STATUSES, useAdminOrdersPage } from "@/hooks/admin/useAdminOrdersPage";
import { AdminErrorBanner, AdminPageShell, AdminSection, adminStyles } from "@/components/admin/admin-ui";

function formatCurrency(value) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(value || 0));
}

export default function AdminOrdersPage() {
  const { orders, filters, pageInfo, ui, actions, popupElement } = useAdminOrdersPage();

  return (
    <AdminPageShell
      title="Quan Ly Don Hang"
      actions={
        <button type="button" onClick={actions.retry} className={adminStyles.secondaryButton}>
          Tai lai
        </button>
      }
    >
      <AdminErrorBanner message={ui.error} />

      <AdminSection>
        <div className={adminStyles.toolbarGrid}>
          <input
            type="text"
            name="search"
            value={filters.search}
            onChange={(event) => actions.setFilter("search", event.target.value)}
            placeholder="Tim theo ma don, nguoi nhan..."
            className={adminStyles.input}
          />
          <select
            name="orderStatus"
            value={filters.orderStatus}
            onChange={(event) => actions.setFilter("orderStatus", event.target.value)}
            className={adminStyles.input}
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
            className={adminStyles.input}
          >
            <option value="">Tat ca trang thai van chuyen</option>
            {ADMIN_SHIPPING_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
      </AdminSection>

      <div className={adminStyles.tableWrapper}>
        <table className={adminStyles.table}>
          <thead className={adminStyles.tableHead}>
            <tr>
              <th className={adminStyles.th}>Ma don</th>
              <th className={adminStyles.th}>Nguoi nhan</th>
              <th className={adminStyles.th}>Loai</th>
              <th className={adminStyles.th}>Trang thai</th>
              <th className={adminStyles.th}>Van chuyen</th>
              <th className={adminStyles.th}>Tong tien</th>
              <th className={adminStyles.th}>Thao tac</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {!ui.isLoading && orders.length === 0 ? (
              <tr>
                <td colSpan={7} className={adminStyles.emptyState}>
                  Khong co du lieu.
                </td>
              </tr>
            ) : null}

            {orders.map((order) => (
              <tr key={order.orderId}>
                <td className={`${adminStyles.td} font-semibold text-slate-950`}>#{order.orderId}</td>
                <td className={adminStyles.td}>{order.receiverName || "-"}</td>
                <td className={adminStyles.td}>{order.orderType || "-"}</td>
                <td className={adminStyles.td}>{order.orderStatus || "-"}</td>
                <td className={adminStyles.td}>{order.shippingStatus || "-"}</td>
                <td className={adminStyles.td}>{formatCurrency(order.totalAmount)}</td>
                <td className={adminStyles.td}>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => actions.goToDetail(order.orderId)}
                      className={adminStyles.smallButton}
                    >
                      Chi tiet
                    </button>
                    <button
                      type="button"
                      onClick={() => actions.updateOrderStatus(order.orderId)}
                      className={adminStyles.smallButton}
                    >
                      Doi trang thai don
                    </button>
                    <button
                      type="button"
                      onClick={() => actions.updateShippingStatus(order.orderId)}
                      className={adminStyles.smallButton}
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

      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          disabled={filters.page <= 1}
          onClick={() => actions.setFilter("page", Math.max(1, filters.page - 1))}
          className={adminStyles.secondaryButton}
        >
          Truoc
        </button>
        <span className="text-base font-medium text-slate-700">
          Trang {filters.page}/{pageInfo.totalPages || 1}
        </span>
        <button
          type="button"
          disabled={filters.page >= (pageInfo.totalPages || 1)}
          onClick={() => actions.setFilter("page", Math.min(pageInfo.totalPages || 1, filters.page + 1))}
          className={adminStyles.secondaryButton}
        >
          Sau
        </button>
      </div>
      {popupElement}
    </AdminPageShell>
  );
}
