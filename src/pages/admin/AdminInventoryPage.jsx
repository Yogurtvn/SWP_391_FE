import { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { selectAuthState } from "@/store/auth/authSlice";
import { usePopupDialog } from "@/components/common/ui/usePopupDialog";
import { getInventories, getVariantById, updateInventory, updatePreOrder } from "@/services/adminService";

export default function AdminInventoryPage() {
  const { accessToken } = useSelector(selectAuthState);
  const { popupAlert, popupPrompt, popupElement } = usePopupDialog();
  const [inventories, setInventories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchInventories = useCallback(async () => {
    if (!accessToken) {
      setError("Không có access token.");
      setInventories([]);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await getInventories({ page: 1, pageSize: 50, sortBy: "variantId", sortOrder: "asc" }, accessToken);
      const baseItems = result?.items ?? [];

      const enrichedItems = await Promise.all(
        baseItems.map(async (item) => {
          try {
            const variant = await getVariantById(item.variantId, accessToken);
            return { ...item, sku: variant?.sku ?? "-" };
          } catch {
            return { ...item, sku: "-" };
          }
        }),
      );

      setInventories(enrichedItems);
    } catch (requestError) {
      setError(requestError?.message || "Không tải được tồn kho.");
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    fetchInventories();
  }, [fetchInventories]);

  async function handleUpdateQuantity(item) {
    const rawQuantity = await popupPrompt("Nhập số lượng mới:", String(item.quantity ?? 0), {
      title: "Sửa số lượng",
      okText: "Lưu",
      placeholder: "Số lượng",
    });

    if (rawQuantity == null || rawQuantity === "") {
      return;
    }

    const quantity = Number(rawQuantity);

    if (Number.isNaN(quantity) || quantity < 0) {
      await popupAlert("Số lượng không hợp lệ.");
      return;
    }

    try {
      await updateInventory(
        item.variantId,
        {
          quantity,
          isPreOrderAllowed: Boolean(item.isPreOrderAllowed),
          expectedRestockDate: item.expectedRestockDate ?? null,
          preOrderNote: null,
        },
        accessToken,
      );
      fetchInventories();
    } catch (requestError) {
      await popupAlert(requestError?.message || "Không cập nhật được tồn kho.");
    }
  }

  async function handleTogglePreOrder(item) {
    try {
      await updatePreOrder(
        item.variantId,
        {
          isPreOrderAllowed: !item.isPreOrderAllowed,
          expectedRestockDate: item.expectedRestockDate ?? null,
          preOrderNote: null,
        },
        accessToken,
      );
      fetchInventories();
    } catch (requestError) {
      await popupAlert(requestError?.message || "Không cập nhật được trạng thái pre-order.");
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Quản Lý Kho</h1>
        <button
          type="button"
          onClick={fetchInventories}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold"
        >
          Tải lại
        </button>
      </div>

      {error ? <p className="mb-4 rounded-lg bg-red-50 p-3 text-red-700">{error}</p> : null}

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-600">SKU</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-600">Variant ID</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-600">Số lượng</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-600">Pre-order</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-600">Dự kiến nhập hàng</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-600">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {!loading && inventories.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-sm text-gray-500">Không có dữ liệu.</td>
              </tr>
            ) : null}

            {inventories.map((item) => (
              <tr key={item.variantId}>
                <td className="px-4 py-3 text-sm text-gray-700">{item.sku || "-"}</td>
                <td className="px-4 py-3 text-sm font-semibold text-gray-900">{item.variantId}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{item.quantity}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{item.isPreOrderAllowed ? "Bật" : "Tắt"}</td>
                <td className="px-4 py-3 text-sm text-gray-700">
                  {item.expectedRestockDate ? new Date(item.expectedRestockDate).toLocaleString("vi-VN") : "-"}
                </td>
                <td className="px-4 py-3 text-sm">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleUpdateQuantity(item)}
                      className="rounded-md border border-gray-300 px-2 py-1 text-xs font-semibold"
                    >
                      Sửa số lượng
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTogglePreOrder(item)}
                      className="rounded-md border border-gray-300 px-2 py-1 text-xs font-semibold"
                    >
                      {item.isPreOrderAllowed ? "Tắt pre-order" : "Bật pre-order"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {popupElement}
    </div>
  );
}
