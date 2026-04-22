import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { AlertCircle, Clock, Eye, Package, RefreshCw } from "lucide-react";
import { selectAuthState } from "@/store/auth/authSlice";
import { clearOrderList, fetchOrderList, selectOrderState } from "@/store/order/orderSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

const PRE_ORDER_FILTERS = {
  orderType: "preOrder",
  page: 1,
  pageSize: 50,
  sortBy: "createdAt",
  sortOrder: "desc",
};

export default function MyPreOrdersPage() {
  const dispatch = useAppDispatch();
  const auth = useAppSelector(selectAuthState);
  const order = useAppSelector(selectOrderState);
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  useEffect(() => {
    if (!auth.isReady) {
      return;
    }

    if (!auth.accessToken) {
      dispatch(clearOrderList());
      return;
    }

    void dispatch(fetchOrderList(PRE_ORDER_FILTERS));
  }, [auth.accessToken, auth.isReady, dispatch]);

  useEffect(() => {
    if (!selectedOrderId && order.items.length > 0) {
      setSelectedOrderId(order.items[0].orderId);
    }
  }, [order.items, selectedOrderId]);

  const selectedOrder = useMemo(
    () => order.items.find((item) => item.orderId === selectedOrderId) ?? order.items[0] ?? null,
    [order.items, selectedOrderId],
  );

  const isLoading = order.listStatus === "loading";
  const isEmpty = order.listStatus === "succeeded" && order.items.length === 0;

  return (
    <div className="min-h-screen bg-secondary/30 py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="mb-3 text-3xl">Pre-orders của tôi</h1>
            <p className="text-muted-foreground">
              Theo dõi các đơn hàng có `orderType=preOrder` từ backend.
            </p>
          </div>

          <Link
            to="/shop"
            className="rounded-xl bg-primary px-5 py-3 text-white transition-colors hover:bg-primary/90"
          >
            Tạo pre-order mới
          </Link>
        </div>

        {order.listError ? (
          <StatePanel
            icon={AlertCircle}
            title="Không thể tải danh sách pre-order"
            description={order.listError}
            action={{
              label: "Tải lại",
              onClick: () => dispatch(fetchOrderList(PRE_ORDER_FILTERS)),
            }}
          />
        ) : isLoading ? (
          <StatePanel
            icon={RefreshCw}
            title="Đang tải pre-orders"
            description="FE đang gọi GET /api/orders?orderType=preOrder."
            loading
          />
        ) : isEmpty ? (
          <StatePanel
            icon={Package}
            title="Chưa có pre-order nào"
            description="Hãy chọn sản phẩm có nút Đặt Trước để tạo đơn pre-order thật qua cart và checkout."
            link={{
              label: "Xem sản phẩm",
              to: "/shop",
            }}
          />
        ) : (
          <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
            <section className="space-y-4">
              {order.items.map((item) => (
                <button
                  key={item.orderId}
                  type="button"
                  onClick={() => setSelectedOrderId(item.orderId)}
                  className={`w-full rounded-2xl border bg-white p-5 text-left transition-colors ${
                    selectedOrder?.orderId === item.orderId
                      ? "border-primary shadow-sm"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="mb-3 flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold">Pre-order #{item.orderId}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{item.createdAtLabel}</p>
                    </div>
                    <StatusPill order={item} />
                  </div>
                  <p className="line-clamp-1 text-sm">{item.firstItemName}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {item.itemCount} sản phẩm · {formatCurrency(item.totalAmount)}
                  </p>
                </button>
              ))}
            </section>

            <section className="rounded-[28px] border border-border bg-white p-6 shadow-sm">
              {selectedOrder ? (
                <>
                  <div className="mb-6 flex flex-wrap items-start justify-between gap-4 border-b border-border pb-5">
                    <div>
                      <p className="mb-1 text-sm text-muted-foreground">Mã đơn</p>
                      <h2 className="text-2xl">#{selectedOrder.orderId}</h2>
                    </div>
                    <StatusPill order={selectedOrder} />
                  </div>

                  <div className="mb-6 grid gap-4 md:grid-cols-2">
                    <InfoCard label="Người nhận" value={selectedOrder.receiverName} />
                    <InfoCard label="Ngày tạo" value={selectedOrder.createdAtLabel} />
                    <InfoCard label="Thanh toán" value={selectedOrder.paymentStatusLabel || "Chờ thanh toán"} />
                    <InfoCard label="Tổng tiền" value={formatCurrency(selectedOrder.totalAmount)} accent />
                  </div>

                  <div className="mb-6 rounded-2xl bg-secondary/70 p-4">
                    <p className="mb-3 font-semibold">Sản phẩm</p>
                    <div className="flex gap-4">
                      <img
                        src={selectedOrder.firstItemImage}
                        alt={selectedOrder.firstItemName}
                        className="h-24 w-24 rounded-xl object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2">{selectedOrder.firstItemName}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{selectedOrder.firstItemSubtitle}</p>
                        <p className="mt-1 text-sm text-muted-foreground">Số lượng: {selectedOrder.firstItemQuantity}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Link
                      to={`/orders/${selectedOrder.orderId}`}
                      className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-white transition-colors hover:bg-primary/90"
                    >
                      <Eye className="h-4 w-4" />
                      Xem chi tiết đơn
                    </Link>
                    <Link
                      to={`/invoice/${selectedOrder.orderId}`}
                      className="rounded-xl border border-border px-5 py-3 transition-colors hover:bg-secondary"
                    >
                      Xem hóa đơn
                    </Link>
                  </div>
                </>
              ) : (
                <div className="py-16 text-center text-muted-foreground">
                  Chọn một pre-order để xem chi tiết.
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

function StatePanel({ icon: Icon, title, description, action, link, loading = false }) {
  return (
    <div className="rounded-[28px] border border-border bg-white px-8 py-16 text-center shadow-sm">
      {loading ? (
        <div className="mx-auto mb-5 h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
      ) : (
        <Icon className="mx-auto mb-5 h-16 w-16 text-primary" />
      )}
      <h2 className="mb-3 text-2xl">{title}</h2>
      <p className="mx-auto mb-8 max-w-2xl text-muted-foreground">{description}</p>
      {action ? (
        <button
          type="button"
          onClick={action.onClick}
          className="rounded-xl bg-primary px-5 py-3 text-white transition-colors hover:bg-primary/90"
        >
          {action.label}
        </button>
      ) : null}
      {link ? (
        <Link
          to={link.to}
          className="rounded-xl bg-primary px-5 py-3 text-white transition-colors hover:bg-primary/90"
        >
          {link.label}
        </Link>
      ) : null}
    </div>
  );
}

function StatusPill({ order }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs ${getStatusClass(order.statusKey)}`}>
      <Clock className="h-3.5 w-3.5" />
      {order.statusLabel}
    </span>
  );
}

function InfoCard({ label, value, accent = false }) {
  return (
    <div className="rounded-2xl border border-border p-4">
      <p className="mb-1 text-sm text-muted-foreground">{label}</p>
      <p className={accent ? "text-lg font-semibold text-primary" : "font-medium"}>{value}</p>
    </div>
  );
}

function getStatusClass(statusKey) {
  switch (statusKey) {
    case "delivered":
      return "bg-green-100 text-green-700";
    case "shipping":
      return "bg-blue-100 text-blue-700";
    case "cancelled":
      return "bg-red-100 text-red-700";
    default:
      return "bg-orange-100 text-orange-700";
  }
}

function formatCurrency(value) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(Number(value ?? 0));
}
