import { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { selectAuthState } from "@/store/auth/authSlice";
import { usePopupDialog } from "@/components/common/ui/usePopupDialog";
import {
  getAllOrders,
  updateOrderStatus,
  updateShippingStatus,
} from "@/services/adminService";

const ORDER_STATUSES = ["Pending", "Confirmed", "AwaitingStock", "Processing", "Shipped", "Completed", "Cancelled"];
const SHIPPING_STATUSES = ["Pending", "Picking", "Delivering", "Delivered", "Failed"];

function formatCurrency(value) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(value || 0));
}

export default function AdminOrdersPage() {
  const { accessToken } = useSelector(selectAuthState);
  const { popupAlert, popupPrompt, popupElement } = usePopupDialog();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchOrders = useCallback(async () => {
    if (!accessToken) {
      setError("Không có access token.");
      setOrders([]);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await getAllOrders(
        {
          page,
          pageSize: 10,
          sortBy: "createdAt",
          sortOrder: "desc",
        },
        accessToken,
      );

      setOrders(result?.items ?? []);
      setTotalPages(result?.totalPages ?? 1);
    } catch (requestError) {
      setError(requestError?.message || "Không tải được danh sách đơn hàng.");
    } finally {
      setLoading(false);
    }
  }, [accessToken, page]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  async function handleUpdateOrderStatus(orderId) {
    const nextStatus = await popupPrompt(
      `Nhập trạng thái mới (${ORDER_STATUSES.join(", ")}):`,
      "",
      { title: "Đổi trạng thái đơn", okText: "Cập nhật" },
    );

    if (!nextStatus) {
      return;
    }

    try {
      await updateOrderStatus(orderId, { orderStatus: nextStatus, note: "Updated by admin" }, accessToken);
      fetchOrders();
    } catch (requestError) {
      await popupAlert(requestError?.message || "Không cập nhật được trạng thái đơn.");
    }
  }

  async function handleUpdateShippingStatus(orderId) {
    const nextStatus = await popupPrompt(
      `Nhập trạng thái vận chuyển (${SHIPPING_STATUSES.join(", ")}):`,
      "",
      { title: "Đổi trạng thái vận chuyển", okText: "Cập nhật" },
    );

    if (!nextStatus) {
      return;
    }

    try {
      await updateShippingStatus(orderId, { shippingStatus: nextStatus }, accessToken);
      fetchOrders();
    } catch (requestError) {
      await popupAlert(requestError?.message || "Không cập nhật được trạng thái vận chuyển.");
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Quản Lý Đơn Hàng</h1>
        <button
          type="button"
          onClick={fetchOrders}
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
              <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-600">Mã đơn</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-600">Người nhận</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-600">Loại</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-600">Trạng thái</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-600">Vận chuyển</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-600">Tổng tiền</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-600">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {!loading && orders.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-sm text-gray-500">
                  Không có dữ liệu.
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
                      onClick={() => handleUpdateOrderStatus(order.orderId)}
                      className="rounded-md border border-gray-300 px-2 py-1 text-xs font-semibold"
                    >
                      Đổi trạng thái đơn
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateShippingStatus(order.orderId)}
                      className="rounded-md border border-gray-300 px-2 py-1 text-xs font-semibold"
                    >
                      Đổi vận chuyển
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
          disabled={page <= 1}
          onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
          className="rounded-md border border-gray-300 px-3 py-1 text-sm disabled:opacity-50"
        >
          Trước
        </button>
        <span className="text-sm text-gray-700">
          Trang {page}/{totalPages}
        </span>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => setPage((currentPage) => Math.min(totalPages, currentPage + 1))}
          className="rounded-md border border-gray-300 px-3 py-1 text-sm disabled:opacity-50"
        >
          Sau
        </button>
      </div>
      {popupElement}
    </div>
  );
}
