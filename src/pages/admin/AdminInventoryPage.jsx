import { useEffect, useMemo, useState } from "react";
import { AdminErrorBanner, AdminPageShell, AdminPagination, AdminSection, adminStyles } from "@/components/admin/admin-ui";
import { useAdminInventoryPage } from "@/hooks/admin/useAdminInventoryPage";

const PAGE_SIZE = 10;

function formatDateTime(value) {
  if (!value) {
    return "-";
  }

  const rawValue = String(value ?? "").trim();
  const noTimezoneIsoPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?$/;
  const normalizedValue = noTimezoneIsoPattern.test(rawValue) ? `${rawValue}Z` : rawValue;
  const date = value instanceof Date ? value : new Date(normalizedValue);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    day: "numeric",
    month: "numeric",
    year: "numeric",
    hour12: false,
  }).format(date);
}

function resolveRecordedValue(value) {
  return String(value ?? "").trim() || "Chưa xác định";
}

export default function AdminInventoryPage() {
  const {
    inventories,
    receipts,
    receiptForm,
    skuOptions,
    receiptDetail,
    ui,
    actions,
    popupElement,
  } = useAdminInventoryPage();
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(inventories.length / PAGE_SIZE));
  const paginatedInventories = useMemo(
    () => inventories.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [inventories, page],
  );
  const latestReceiptByVariantId = useMemo(() => {
    const map = new Map();

    receipts.forEach((receipt) => {
      const variantId = Number(receipt?.variantId ?? 0);
      if (!Number.isFinite(variantId) || variantId <= 0) {
        return;
      }

      const receivedAt = new Date(receipt?.receivedDate ?? 0).getTime();
      const normalizedReceivedAt = Number.isFinite(receivedAt) ? receivedAt : -1;
      const current = map.get(variantId);

      if (!current || normalizedReceivedAt > current.receivedAt) {
        map.set(variantId, {
          receivedAt: normalizedReceivedAt,
          recordedByName: receipt?.recordedByName,
          recordedByRole: receipt?.recordedByRole,
        });
      }
    });

    return map;
  }, [receipts]);

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
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <input
              type="text"
              list="inventory-sku-options"
              autoComplete="off"
              spellCheck={false}
              value={receiptForm.sku}
              onChange={(event) => actions.setReceiptSku(event.target.value)}
              placeholder="Nhập SKU"
              className={adminStyles.input}
              required
            />
            <datalist id="inventory-sku-options">
              {skuOptions.map((sku) => (
                <option key={sku} value={sku} />
              ))}
            </datalist>
            <input
              value={receiptForm.variantId}
              readOnly
              placeholder="Variant ID"
              className={adminStyles.input}
            />
            <input
              type="number"
              min="1"
              value={receiptForm.quantityReceived}
              onChange={(event) => actions.setReceiptField("quantityReceived", event.target.value)}
              placeholder="Số lượng"
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
              <th className={adminStyles.th}>Người nhập / Vai trò</th>
              <th className={adminStyles.th}>Ghi chú pre-order</th>
              <th className={adminStyles.th}>Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {!ui.isLoading && inventories.length === 0 ? (
              <tr>
                <td colSpan={8} className={adminStyles.emptyState}>
                  Không có dữ liệu.
                </td>
              </tr>
            ) : null}

            {paginatedInventories.map((item) => {
              const latestReceipt = latestReceiptByVariantId.get(Number(item.variantId));

              return (
                <tr key={item.variantId}>
                <td className={adminStyles.td}>{item.sku || "-"}</td>
                <td className={`${adminStyles.td} font-semibold text-slate-950`}>{item.variantId}</td>
                <td className={adminStyles.td}>{item.quantity}</td>
                <td className={adminStyles.td}>{item.isPreOrderAllowed ? "Bật" : "Tắt"}</td>
                <td className={adminStyles.td}>{formatDateTime(item.expectedRestockDate)}</td>
                <td className={adminStyles.td}>
                  <ImporterCell
                    name={latestReceipt?.recordedByName}
                    role={latestReceipt?.recordedByRole}
                  />
                </td>
                <td className={adminStyles.td}>{item.preOrderNote || "-"}</td>
                <td className={adminStyles.td}>
                  <div className="flex flex-wrap gap-2">
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
              );
            })}
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
                <th className={adminStyles.th}>Sản phẩm / Variant</th>
                <th className={adminStyles.th}>SKU</th>
                <th className={adminStyles.th}>Variant ID</th>
                <th className={adminStyles.th}>Số lượng</th>
                <th className={adminStyles.th}>Ngày nhận</th>
                <th className={adminStyles.th}>Người nhập hàng</th>
                <th className={adminStyles.th}>Vai trò</th>
                <th className={adminStyles.th}>Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {!ui.isLoading && receipts.length === 0 ? (
                <tr>
                  <td colSpan={9} className={adminStyles.emptyState}>
                    Không có phiếu nhập.
                  </td>
                </tr>
              ) : null}

              {receipts.map((receipt) => (
                <tr key={receipt.receiptId}>
                  <td className={adminStyles.td}>{receipt.receiptId}</td>
                  <td className={adminStyles.td}>
                    <ReceiptProductCell
                      productName={receipt.productName}
                      imageUrl={receipt.productImageUrl}
                    />
                  </td>
                  <td className={adminStyles.td}>{receipt.sku || "-"}</td>
                  <td className={`${adminStyles.td} font-semibold text-slate-950`}>{receipt.variantId}</td>
                  <td className={adminStyles.td}>{receipt.quantityReceived}</td>
                  <td className={adminStyles.td}>{formatDateTime(receipt.receivedDate)}</td>
                  <td className={adminStyles.td}>{resolveRecordedValue(receipt.recordedByName)}</td>
                  <td className={adminStyles.td}>{resolveRecordedValue(receipt.recordedByRole)}</td>
                  <td className={adminStyles.td}>
                    <button
                      type="button"
                      onClick={() => actions.viewReceiptDetail(receipt.receiptId)}
                      disabled={ui.isLoadingReceiptDetail}
                      className={adminStyles.smallButton}
                    >
                      Chi tiết
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminSection>

      {receiptDetail ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-2xl rounded-[1.6rem] border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-xl font-bold text-[#11284b]">Chi tiết phiếu nhập #{receiptDetail.receiptId}</h3>
                <p className="mt-1 text-sm text-slate-500">Thông tin người ghi nhận được lấy trực tiếp từ response BE.</p>
              </div>
              <button type="button" onClick={actions.closeReceiptDetail} className={adminStyles.secondaryButton}>
                Đóng
              </button>
            </div>

            <div className="grid gap-3 text-sm md:grid-cols-2">
              <DetailItem label="Receipt ID" value={receiptDetail.receiptId} />
              <DetailItem label="Sản phẩm" value={receiptDetail.productName || "-"} />
              <DetailItem label="SKU" value={receiptDetail.sku || "-"} />
              <DetailItem label="Variant ID" value={receiptDetail.variantId} />
              <DetailItem label="Số lượng" value={receiptDetail.quantityReceived} />
              <DetailItem label="Ngày nhận" value={formatDateTime(receiptDetail.receivedDate)} />
              <DetailItem label="Người nhập hàng" value={resolveRecordedValue(receiptDetail.recordedByName)} />
              <DetailItem label="Vai trò" value={resolveRecordedValue(receiptDetail.recordedByRole)} />
              <DetailItem label="User ID ghi nhận" value={resolveRecordedValue(receiptDetail.recordedByUserId)} />
              <DetailItem label="Ghi chú" value={resolveRecordedValue(receiptDetail.note || "-")} />
            </div>
          </div>
        </div>
      ) : null}

      {popupElement}
    </AdminPageShell>
  );
}

function DetailItem({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 font-medium text-slate-800">{value}</p>
    </div>
  );
}

function ReceiptProductCell({ productName, imageUrl }) {
  const resolvedName = String(productName ?? "").trim() || "Chưa xác định";
  const fallbackLetter = resolvedName.charAt(0).toUpperCase() || "?";

  return (
    <div className="flex items-center gap-3">
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={resolvedName}
          className="h-11 w-11 rounded-lg border border-slate-200 object-cover"
        />
      ) : (
        <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-slate-200 bg-slate-100 text-sm font-bold text-slate-600">
          {fallbackLetter}
        </div>
      )}
      <p className="font-semibold text-slate-900">{resolvedName}</p>
    </div>
  );
}

function ImporterCell({ name, role }) {
  const resolvedName = resolveRecordedValue(name);
  const resolvedRole = resolveRecordedValue(role);

  return (
    <div className="leading-6">
      <p className="font-semibold text-slate-900">{resolvedName}</p>
      <p className="text-xs text-slate-500">{resolvedRole}</p>
    </div>
  );
}
