import {
  CheckCircle,
  Clock3,
  Eye,
  FileText,
  Loader2,
  Package,
  Search,
  ShoppingBag,
} from "lucide-react";
import { useAdminOrdersPage } from "@/hooks/admin/useAdminOrdersPage";
import { getOrderStatusPresentation, getShippingStatusPresentation } from "@/utils/orderStatus";

function formatCurrency(value) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(value || 0));
}

function formatDateTime(value) {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleString("vi-VN");
}

function normalizeValue(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");
}

function hasValue(value) {
  return value !== null && value !== undefined && String(value).trim() !== "" && String(value).trim() !== "-";
}

function getTypeLabel(type) {
  const normalized = normalizeValue(type);

  if (normalized === "ready" || normalized === "regular") return "Đơn thường";
  if (normalized === "prescription") return "Đơn kính";
  if (normalized === "preorder") return "Pre-order";
  return type || "-";
}

function getTypeIcon(type) {
  const normalized = normalizeValue(type);

  if (normalized === "prescription") return FileText;
  if (normalized === "preorder") return Clock3;
  return Package;
}

export default function AdminOrdersPage() {
  const {
    orders,
    filters,
    selectedOrderId,
    selectedOrderSummary,
    selectedOrder,
    orderTypeOptions,
    typeFilter,
    ui,
    actions,
    popupElement,
  } = useAdminOrdersPage();

  const detailOrder = selectedOrder ?? selectedOrderSummary;

  return (
    <div className="min-h-screen bg-orange-50 px-4 py-6 md:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="rounded-2xl border-2 border-orange-300 bg-white p-6 shadow-sm xl:flex-1">
            <h1 className="mb-2 text-3xl font-bold text-gray-900">Quản Lý Đơn Hàng</h1>
            <p className="font-medium text-gray-600">Xác nhận, duyệt đơn kính và pre-order</p>
          </div>
          <button
            type="button"
            onClick={actions.retry}
            className="inline-flex items-center justify-center rounded-2xl border-2 border-orange-300 bg-white px-5 py-3 font-bold text-gray-900 shadow-sm transition hover:bg-orange-50"
          >
            Tải lại
          </button>
        </div>

        {ui.error ? (
          <div className="rounded-2xl border-2 border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {ui.error}
          </div>
        ) : null}

        <div className="rounded-2xl border-2 border-orange-300 bg-white p-6 shadow-sm">
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={filters.search}
                onChange={(event) => actions.setFilter("search", event.target.value)}
                placeholder="Tìm kiếm theo mã đơn hoặc tên khách hàng..."
                className="w-full rounded-xl border-2 border-gray-300 py-3 pl-12 pr-4 text-base text-gray-900 transition-all placeholder:text-gray-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
              />
            </div>

            <div className="flex flex-col gap-4 md:flex-row">
              <select
                value={typeFilter}
                onChange={(event) => actions.setTypeFilter(event.target.value)}
                className="rounded-xl border-2 border-gray-300 px-4 py-3 font-medium text-gray-900 focus:border-orange-500 focus:outline-none"
              >
                <option value="all">Tất cả loại đơn</option>
                {orderTypeOptions.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>

              <select
                value={filters.orderStatus}
                onChange={(event) => actions.setFilter("orderStatus", event.target.value)}
                className="rounded-xl border-2 border-gray-300 px-4 py-3 font-medium text-gray-900 focus:border-orange-500 focus:outline-none"
              >
                <option value="">Tất cả trạng thái</option>
                <option value="Pending">Chờ duyệt</option>
                <option value="Confirmed">Đã xác nhận</option>
                <option value="AwaitingStock">Chờ hàng</option>
                <option value="Processing">Đang xử lý</option>
                <option value="Shipped">Đang giao</option>
                <option value="Completed">Hoàn thành</option>
                <option value="Cancelled">Đã hủy</option>
              </select>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <div className="max-h-[calc(100vh-18rem)] space-y-3 overflow-y-auto pr-1">
              {ui.isLoading ? (
                <div className="rounded-2xl border-2 border-orange-200 bg-white p-6 text-center">
                  <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-orange-500" />
                  <p className="font-medium text-gray-600">Đang tải đơn hàng...</p>
                </div>
              ) : null}

              {!ui.isLoading && orders.length === 0 ? (
                <div className="rounded-2xl border-2 border-orange-200 bg-white p-6 text-center text-gray-500">
                  Không tìm thấy đơn hàng nào
                </div>
              ) : null}

              {orders.map((order) => {
                const Icon = getTypeIcon(order.orderType);
                const isSelected = String(selectedOrderId) === String(order.orderId);
                const statusPresentation = getOrderStatusPresentation(order.orderStatus);

                return (
                  <button
                    key={order.orderId}
                    type="button"
                    onClick={() => actions.selectOrder(order.orderId)}
                    className={`w-full rounded-2xl border-2 bg-white p-5 text-left transition-all ${
                      isSelected
                        ? "border-orange-500 bg-orange-50 shadow-md"
                        : "border-orange-200 hover:border-orange-400 hover:shadow-sm"
                    }`}
                  >
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-gray-700" />
                        <span className="text-sm font-bold text-gray-900">#{order.orderId}</span>
                      </div>
                      <span className={`rounded-lg border-2 px-3 py-1 text-xs font-bold ${statusPresentation.className}`}>
                        {statusPresentation.label}
                      </span>
                    </div>

                    {hasValue(order.receiverName || order.customerName) ? (
                      <p className="mb-2 text-sm font-medium text-gray-700">{order.receiverName || order.customerName}</p>
                    ) : null}

                    <div className="flex items-center justify-between gap-3 text-xs text-gray-600">
                      <span className="font-medium">{getTypeLabel(order.orderType)}</span>
                      <span className="font-bold text-orange-600">{formatCurrency(order.totalAmount)}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-2">
            {!detailOrder ? (
              <div className="rounded-2xl border-2 border-orange-200 bg-white p-12 text-center">
                <Eye className="mx-auto mb-4 h-20 w-20 text-orange-400" />
                <p className="text-lg font-medium text-gray-600">Chọn một đơn hàng để xem chi tiết</p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border-2 border-orange-300 bg-white shadow-sm">
                <div className="border-b-2 border-orange-300 bg-orange-50 p-6">
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <div>
                      <h2 className="mb-2 text-2xl font-bold text-gray-900">#{detailOrder.orderId}</h2>
                      <p className="text-sm font-medium text-gray-600">{getTypeLabel(detailOrder.orderType)}</p>
                    </div>
                    <span className={`rounded-xl border-2 px-4 py-2 text-sm font-bold ${getOrderStatusPresentation(detailOrder.orderStatus).className}`}>
                      {getOrderStatusPresentation(detailOrder.orderStatus).label}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm text-gray-700">
                    {hasValue(detailOrder.receiverName || detailOrder.customerName) ? (
                      <p>
                        <span className="font-bold text-gray-500">Người nhận:</span> {detailOrder.receiverName || detailOrder.customerName}
                      </p>
                    ) : null}
                    {hasValue(detailOrder.receiverPhone) ? (
                      <p>
                        <span className="font-bold text-gray-500">Số điện thoại:</span> {detailOrder.receiverPhone}
                      </p>
                    ) : null}
                    {hasValue(detailOrder.shippingAddress) ? (
                      <p>
                        <span className="font-bold text-gray-500">Địa chỉ:</span> {detailOrder.shippingAddress}
                      </p>
                    ) : null}
                    {hasValue(detailOrder.createdAt) ? (
                      <p>
                        <span className="font-bold text-gray-500">Ngày tạo:</span> {formatDateTime(detailOrder.createdAt)}
                      </p>
                    ) : null}
                    {hasValue(detailOrder.shippingStatus) ? (
                      <p>
                        <span className="font-bold text-gray-500">Vận chuyển:</span> {getShippingStatusPresentation(detailOrder.shippingStatus).label}
                      </p>
                    ) : null}
                  </div>
                </div>

                {ui.detailLoading && !selectedOrder ? (
                  <div className="p-8 text-center">
                    <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-orange-500" />
                    <p className="font-medium text-gray-600">Đang tải chi tiết đơn hàng...</p>
                  </div>
                ) : null}

                {selectedOrder?.items?.length ? (
                  <div className="border-b-2 border-orange-200 p-6">
                    <h3 className="mb-4 text-lg font-bold text-gray-900">Sản phẩm</h3>
                    <div className="space-y-3">
                      {selectedOrder.items.map((item) => (
                        <div
                          key={item.orderItemId || `${item.productName}-${item.sku}-${item.quantity}`}
                          className="flex items-center justify-between rounded-xl border-2 border-gray-200 bg-gray-50 p-4 text-sm"
                        >
                          <div>
                            <p className="font-bold text-gray-900">{item.productName || "-"}</p>
                            <p className="font-medium text-gray-600">SKU: {item.sku || "-"}</p>
                            <p className="font-medium text-gray-600">Số lượng: {item.quantity ?? 0}</p>
                          </div>
                          <p className="font-bold text-orange-600">{formatCurrency(item.lineTotal ?? item.totalPrice ?? item.unitPrice)}</p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 flex items-center justify-between border-t-2 border-gray-200 pt-4">
                      <span className="font-bold text-gray-900">Tổng cộng:</span>
                      <span className="text-2xl font-bold text-orange-600">{formatCurrency(selectedOrder.totalAmount)}</span>
                    </div>
                  </div>
                ) : (
                  <div className="border-b-2 border-orange-200 p-6">
                    <div className="rounded-xl border-2 border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                      Không có dữ liệu chi tiết sản phẩm trong đơn này.
                    </div>
                  </div>
                )}

                <div className="border-b-2 border-orange-200 p-6">
                  <h3 className="mb-4 text-lg font-bold text-gray-900">Thanh toán & giao hàng</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    {hasValue(selectedOrder?.payment?.paymentMethod || detailOrder.paymentMethod) ||
                    hasValue(selectedOrder?.payment?.paymentStatus || detailOrder.paymentStatus) ? (
                      <div className="rounded-xl border-2 border-blue-200 bg-blue-50 p-4 text-sm">
                        <p className="mb-2 font-bold text-gray-900">Thanh toán</p>
                        {hasValue(selectedOrder?.payment?.paymentMethod || detailOrder.paymentMethod) ? (
                          <p className="font-medium text-gray-700">
                            Phương thức: {selectedOrder?.payment?.paymentMethod || detailOrder.paymentMethod}
                          </p>
                        ) : null}
                        {hasValue(selectedOrder?.payment?.paymentStatus || detailOrder.paymentStatus) ? (
                          <p className="font-medium text-gray-700">
                            Trạng thái: {selectedOrder?.payment?.paymentStatus || detailOrder.paymentStatus}
                          </p>
                        ) : null}
                      </div>
                    ) : null}
                    {detailOrder.shippingCode || detailOrder.expectedDeliveryDate ? (
                      <div className="rounded-xl border-2 border-orange-200 bg-orange-50 p-4 text-sm">
                        <p className="mb-2 font-bold text-gray-900">Giao hàng</p>
                        {detailOrder.shippingCode ? (
                          <p className="font-medium text-gray-700">Mã vận đơn: {detailOrder.shippingCode}</p>
                        ) : null}
                        {detailOrder.expectedDeliveryDate ? (
                          <p className="font-medium text-gray-700">
                            Dự kiến giao: {formatDateTime(detailOrder.expectedDeliveryDate)}
                          </p>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="bg-orange-50 p-6">
                  <h3 className="mb-4 text-lg font-bold text-gray-900">Thao tác</h3>
                  <div className="flex flex-col gap-3 md:flex-row">
                    <button
                      type="button"
                      onClick={() => actions.goToDetail(detailOrder.orderId)}
                      className="flex items-center justify-center gap-2 rounded-xl border-2 border-gray-300 bg-white px-5 py-3 font-bold text-gray-900 transition hover:bg-gray-50"
                    >
                      <ShoppingBag className="h-5 w-5" />
                      Trang chi tiết
                    </button>
                    <button
                      type="button"
                      onClick={() => actions.updateOrderStatus(detailOrder.orderId)}
                      className="flex items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-3 font-bold text-white transition hover:bg-green-700"
                    >
                      <CheckCircle className="h-5 w-5" />
                      Đổi trạng thái đơn
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {popupElement}
    </div>
  );
}
