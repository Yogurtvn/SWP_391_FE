import { useEffect, useMemo, useState } from "react";
import { AdminErrorBanner, AdminPageShell, AdminPagination, AdminSection, adminStyles } from "@/components/admin/admin-ui";
import { useAdminInventoryPage } from "@/hooks/admin/useAdminInventoryPage";

const PAGE_SIZE = 10;

function formatDateTime(value) {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleString("vi-VN");
}

export default function AdminInventoryPage() {
  const { inventories, receipts, receiptForm, ui, actions, popupElement } = useAdminInventoryPage();
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(inventories.length / PAGE_SIZE));
  const paginatedInventories = useMemo(
    () => inventories.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [inventories, page],
  );

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

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

          <button type="submit" className="rounded-[1.2rem] bg-emerald-600 px-5 py-3 text-base font-bold text-white shadow-[0_12px_24px_rgba(5,150,105,0.2)] transition hover:bg-emerald-700">
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
              <th className={adminStyles.th}>Cho đặt trước</th>
              <th className={adminStyles.th}>Ngày dự kiến có hàng</th>
              <th className={adminStyles.th}>Ghi chú pre-order</th>
              <th className={adminStyles.th}>Thao tác</th>
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

            {paginatedInventories.map((item) => (
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
                      className="inline-flex items-center justify-center rounded-[1rem] border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-bold text-sky-700 shadow-[0_6px_12px_rgba(14,165,233,0.08)] transition hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Sửa số lượng
                    </button>
                    <button
                      type="button"
                      onClick={() => actions.editPreOrder(item)}
                      className="inline-flex items-center justify-center rounded-[1rem] border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-bold text-orange-700 shadow-[0_6px_12px_rgba(249,115,22,0.08)] transition hover:bg-orange-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Sửa pre-order
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <AdminPagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          summary={`Trang ${page} / ${totalPages} - hiển thị ${paginatedInventories.length} / ${inventories.length} dòng`}
        />
      </div>

      <AdminSection title="Phiếu nhập gần đây">
        <div className="overflow-x-auto">
          <table className={adminStyles.table}>
            <thead className={adminStyles.tableHead}>
              <tr>
                <th className={adminStyles.th}>Mã phiếu nhập</th>
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
