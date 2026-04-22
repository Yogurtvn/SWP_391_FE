import { AdminErrorBanner, AdminPageShell, AdminSection, adminStyles } from "@/components/admin/admin-ui";
import { useAdminInventoryPage } from "@/hooks/admin/useAdminInventoryPage";

function formatDateTime(value) {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleString("vi-VN");
}

export default function AdminInventoryPage() {
  const { inventories, receipts, receiptForm, ui, actions, popupElement } = useAdminInventoryPage();

  return (
    <AdminPageShell
      title="Quản Lý Kho"
      actions={
        <button type="button" onClick={actions.retry} className={adminStyles.secondaryButton}>
          Tải lại
        </button>
      }
    >
      <AdminErrorBanner message={ui.error} />

      <AdminSection title="Nhập kho theo phiếu nhập">
        <form onSubmit={actions.createReceipt} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <input
              type="number"
              min="1"
              value={receiptForm.variantId}
              onChange={(event) => actions.setReceiptField("variantId", event.target.value)}
              placeholder="Variant ID"
              className={adminStyles.input}
              required
            />
            <input
              type="number"
              min="1"
              value={receiptForm.quantityReceived}
              onChange={(event) => actions.setReceiptField("quantityReceived", event.target.value)}
              placeholder="Số lượng nhập"
              className={adminStyles.input}
              required
            />
            <input
              value={receiptForm.note}
              onChange={(event) => actions.setReceiptField("note", event.target.value)}
              placeholder="Ghi chú"
              className={adminStyles.input}
            />
          </div>

          <button type="submit" className={adminStyles.primaryButton}>
            Tạo phiếu nhập
          </button>
        </form>
      </AdminSection>

      <div className={adminStyles.tableWrapper}>
        <table className={adminStyles.table}>
          <thead className={adminStyles.tableHead}>
            <tr>
              <th className={adminStyles.th}>SKU</th>
              <th className={adminStyles.th}>Variant ID</th>
              <th className={adminStyles.th}>Số lượng</th>
              <th className={adminStyles.th}>Pre-order</th>
              <th className={adminStyles.th}>Restock date</th>
              <th className={adminStyles.th}>Pre-order note</th>
              <th className={adminStyles.th}>Thao tac</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {!ui.isLoading && inventories.length === 0 ? (
              <tr>
                <td colSpan={7} className={adminStyles.emptyState}>
                  Không có dữ liệu.
                </td>
              </tr>
            ) : null}

            {inventories.map((item) => (
              <tr key={item.variantId}>
                <td className={adminStyles.td}>{item.sku || "-"}</td>
                <td className={`${adminStyles.td} font-semibold text-slate-950`}>{item.variantId}</td>
                <td className={adminStyles.td}>{item.quantity}</td>
                <td className={adminStyles.td}>{item.isPreOrderAllowed ? "Bật" : "Tắt"}</td>
                <td className={adminStyles.td}>{formatDateTime(item.expectedRestockDate)}</td>
                <td className={adminStyles.td}>{item.preOrderNote || "-"}</td>
                <td className={adminStyles.td}>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => actions.updateQuantity(item)}
                      className={adminStyles.smallButton}
                    >
                      Sửa số lượng
                    </button>
                    <button
                      type="button"
                      onClick={() => actions.editPreOrder(item)}
                      className={adminStyles.smallButton}
                    >
                      Sửa pre-order
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AdminSection title="Phiếu nhập gần đây">
        <div className="overflow-x-auto">
          <table className={adminStyles.table}>
            <thead className={adminStyles.tableHead}>
              <tr>
                <th className={adminStyles.th}>Receipt ID</th>
                <th className={adminStyles.th}>Variant ID</th>
                <th className={adminStyles.th}>Số lượng nhập</th>
                <th className={adminStyles.th}>Ngày nhận</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {!ui.isLoading && receipts.length === 0 ? (
                <tr>
                  <td colSpan={4} className={adminStyles.emptyState}>
                    Không có phiếu nhập.
                  </td>
                </tr>
              ) : null}

              {receipts.map((receipt) => (
                <tr key={receipt.receiptId}>
                  <td className={adminStyles.td}>{receipt.receiptId}</td>
                  <td className={`${adminStyles.td} font-semibold text-slate-950`}>{receipt.variantId}</td>
                  <td className={adminStyles.td}>{receipt.quantityReceived}</td>
                  <td className={adminStyles.td}>{formatDateTime(receipt.receivedDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminSection>

      {popupElement}
    </AdminPageShell>
  );
}
