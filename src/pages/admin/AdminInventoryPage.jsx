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
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Quan Ly Kho</h1>
        <button
          type="button"
          onClick={actions.retry}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold"
        >
          Tai lai
        </button>
      </div>

      {ui.error ? <p className="mb-4 rounded-lg bg-red-50 p-3 text-red-700">{ui.error}</p> : null}

      <form onSubmit={actions.createReceipt} className="mb-6 rounded-xl border border-gray-200 bg-white p-4">
        <h2 className="mb-3 text-lg font-semibold">Nhap kho theo phieu nhap</h2>
        <div className="grid gap-3 md:grid-cols-3">
          <input
            type="number"
            min="1"
            value={receiptForm.variantId}
            onChange={(event) => actions.setReceiptField("variantId", event.target.value)}
            placeholder="Variant ID"
            className="rounded-md border border-gray-300 px-3 py-2"
            required
          />
          <input
            type="number"
            min="1"
            value={receiptForm.quantityReceived}
            onChange={(event) => actions.setReceiptField("quantityReceived", event.target.value)}
            placeholder="So luong nhap"
            className="rounded-md border border-gray-300 px-3 py-2"
            required
          />
          <input
            value={receiptForm.note}
            onChange={(event) => actions.setReceiptField("note", event.target.value)}
            placeholder="Ghi chu"
            className="rounded-md border border-gray-300 px-3 py-2"
          />
        </div>

        <button type="submit" className="mt-3 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white">
          Tao phieu nhap
        </button>
      </form>

      <div className="mb-6 overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-600">SKU</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-600">Variant ID</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-600">So luong</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-600">Pre-order</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-600">Restock date</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-600">Pre-order note</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-600">Thao tac</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {!ui.isLoading && inventories.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-sm text-gray-500">
                  Khong co du lieu.
                </td>
              </tr>
            ) : null}

            {inventories.map((item) => (
              <tr key={item.variantId}>
                <td className="px-4 py-3 text-sm text-gray-700">{item.sku || "-"}</td>
                <td className="px-4 py-3 text-sm font-semibold text-gray-900">{item.variantId}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{item.quantity}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{item.isPreOrderAllowed ? "Bat" : "Tat"}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{formatDateTime(item.expectedRestockDate)}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{item.preOrderNote || "-"}</td>
                <td className="px-4 py-3 text-sm">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => actions.updateQuantity(item)}
                      className="rounded-md border border-gray-300 px-2 py-1 text-xs font-semibold"
                    >
                      Sua so luong
                    </button>
                    <button
                      type="button"
                      onClick={() => actions.editPreOrder(item)}
                      className="rounded-md border border-gray-300 px-2 py-1 text-xs font-semibold"
                    >
                      Sua pre-order
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section className="rounded-xl border border-gray-200 bg-white p-4">
        <h2 className="mb-3 text-lg font-semibold text-gray-900">Phieu nhap gan day</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-600">Receipt ID</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-600">Variant ID</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-600">So luong nhap</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-600">Ngay nhan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {!ui.isLoading && receipts.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-sm text-gray-500">
                    Khong co phieu nhap.
                  </td>
                </tr>
              ) : null}

              {receipts.map((receipt) => (
                <tr key={receipt.receiptId}>
                  <td className="px-4 py-3 text-sm text-gray-700">{receipt.receiptId}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900">{receipt.variantId}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{receipt.quantityReceived}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{formatDateTime(receipt.receivedDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {popupElement}
    </div>
  );
}
