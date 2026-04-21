import { Link, useLocation } from "react-router";
import {
  ArrowRight,
  CheckCircle2,
  PackageCheck,
  ShoppingBag,
  Truck,
  Wallet,
} from "lucide-react";
import { usePayOsCallback } from "@/hooks/order/usePayOsCallback";

export default function OrderSuccessPage() {
  const location = useLocation();
  const fallbackOrderSummary =
    location.state?.orderSummary ??
    (location.search ? createPayOsFallbackOrderSummary() : createFallbackOrderSummary());
  const {
    authRequired,
    isExternalCallback,
    lookup,
    orderSummary,
  } = usePayOsCallback(fallbackOrderSummary);
  const resolvedOrderSummary = orderSummary ?? fallbackOrderSummary;
  const canTrackOrder = Number(resolvedOrderSummary.orderId ?? 0) > 0;

  if (authRequired) {
    return (
      <CallbackStateCard
        title="Cần đăng nhập để xem kết quả PayOS"
        description="PayOS đã chuyển bạn về website, nhưng hệ thống cần xác thực lại tài khoản để tải thông tin đơn hàng."
        primaryAction={{
          label: "Đăng nhập",
          to: "/login",
        }}
        secondaryAction={{
          label: "Về giỏ hàng",
          to: "/cart",
        }}
      />
    );
  }

  if (isExternalCallback && lookup.status === "loading") {
    return (
      <CallbackStateCard
        title="Đang đồng bộ kết quả thanh toán"
        description="Hệ thống đang đối chiếu kết quả trả về từ PayOS với đơn hàng trong backend."
        loading
      />
    );
  }

  return (
    <div className="min-h-screen bg-secondary/30 py-12">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-[28px] border border-border bg-white shadow-sm">
          <div className="border-b border-border bg-[linear-gradient(135deg,#fff8ec_0%,#fff_55%,#f6fff7_100%)] px-8 py-12 text-center">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-green-600">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <p className="mb-3 text-sm uppercase tracking-[0.24em] text-green-700">Đặt hàng thành công</p>
            <h1 className="mb-3 text-3xl">Đơn hàng đã được tạo</h1>
            <p className="mx-auto max-w-2xl text-muted-foreground leading-7">
              Vision Direct đã ghi nhận đơn hàng của bạn.
              Đội ngũ sẽ bắt đầu xử lý ngay sau khi tiếp nhận.
            </p>
          </div>

          <div className="grid gap-0 lg:grid-cols-[1.5fr_1fr]">
            <div className="border-b border-border p-8 lg:border-b-0 lg:border-r">
              <div className="mb-8 grid gap-4 sm:grid-cols-2">
                <SummaryCard
                  icon={PackageCheck}
                  label="Mã đơn hàng"
                  value={Number(resolvedOrderSummary.orderId) > 0 ? `#${resolvedOrderSummary.orderId}` : "Đang cập nhật"}
                />
                <SummaryCard
                  icon={Wallet}
                  label="Phương thức thanh toán"
                  value={resolvedOrderSummary.paymentMethodLabel}
                />
                <SummaryCard
                  icon={Truck}
                  label="Trạng thái đơn"
                  value={resolvedOrderSummary.orderStatusLabel}
                />
                <SummaryCard
                  icon={ShoppingBag}
                  label="Tổng thanh toán"
                  value={formatCurrency(resolvedOrderSummary.total)}
                />
              </div>

              {isExternalCallback && lookup.status === "failed" ? (
                <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
                  {lookup.error}
                </div>
              ) : null}

              <div className="mb-6 rounded-2xl bg-secondary/60 p-6">
                <h2 className="mb-4 text-lg">Thông tin nhận hàng</h2>
                <div className="space-y-2 text-sm text-foreground/90">
                  <p>{resolvedOrderSummary.customerName}</p>
                  <p>{resolvedOrderSummary.phone}</p>
                  <p>{resolvedOrderSummary.email}</p>
                  <p>{resolvedOrderSummary.shippingAddress}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-border p-6">
                <h2 className="mb-4 text-lg">Cập nhật tiếp theo</h2>
                <div className="space-y-3 text-sm text-muted-foreground">
                  <p>Trạng thái hiện tại: {resolvedOrderSummary.orderStatusLabel}.</p>
                  {resolvedOrderSummary.orderType === "preOrder" ? (
                    <p>Đây là đơn đặt trước. Bạn sẽ nhận email khi sản phẩm về kho.</p>
                  ) : null}
                  <p>Thanh toán: {resolvedOrderSummary.paymentStatusLabel}.</p>
                  <p>Bạn có thể mở chi tiết đơn hàng để theo dõi các mốc xử lý tiếp theo.</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-8">
              <div className="mb-6 rounded-2xl bg-secondary/60 p-6">
                <p className="mb-2 text-sm text-muted-foreground">Đặt lúc</p>
                <p className="mb-4 text-lg">{resolvedOrderSummary.createdAtLabel}</p>
                <p className="mb-2 text-sm text-muted-foreground">Số sản phẩm</p>
                <p className="text-lg">{resolvedOrderSummary.itemCount} sản phẩm</p>
              </div>

              <div className="space-y-3">
                {canTrackOrder ? (
                  <Link
                    to={`/orders/${resolvedOrderSummary.orderId}`}
                    className="flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-white transition-colors hover:bg-primary/90"
                  >
                    Theo dõi đơn hàng
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                ) : null}
                <Link
                  to="/shop"
                  className="flex items-center justify-center gap-2 rounded-xl border border-border px-5 py-3 transition-colors hover:bg-secondary"
                >
                  Tiếp tục mua sắm
                </Link>
                <Link
                  to="/cart"
                  className="flex items-center justify-center gap-2 rounded-xl border border-border px-5 py-3 transition-colors hover:bg-secondary"
                >
                  Về giỏ hàng
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CallbackStateCard({ title, description, primaryAction, secondaryAction, loading = false }) {
  return (
    <div className="min-h-screen bg-secondary/30 py-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-[28px] border border-border bg-white px-8 py-16 text-center shadow-sm">
          {loading ? (
            <div className="mx-auto mb-5 h-12 w-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          ) : (
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Wallet className="h-10 w-10" />
            </div>
          )}
          <h1 className="mb-3 text-3xl">{title}</h1>
          <p className="mx-auto mb-8 max-w-2xl text-muted-foreground leading-7">{description}</p>
          <div className="flex flex-wrap justify-center gap-3">
            {primaryAction ? (
              <Link
                to={primaryAction.to}
                className="rounded-xl bg-primary px-5 py-3 text-white transition-colors hover:bg-primary/90"
              >
                {primaryAction.label}
              </Link>
            ) : null}
            {secondaryAction ? (
              <Link
                to={secondaryAction.to}
                className="rounded-xl border border-border px-5 py-3 transition-colors hover:bg-secondary"
              >
                {secondaryAction.label}
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-border bg-white p-5">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <p className="mb-1 text-sm text-muted-foreground">{label}</p>
      <p className="text-base">{value}</p>
    </div>
  );
}

function createFallbackOrderSummary() {
  return {
    orderId: 0,
    orderCreated: false,
    orderStatusLabel: "Chờ xác nhận",
    paymentMethod: "cod",
    paymentMethodLabel: "Thanh toán khi nhận hàng",
    paymentStatus: "pending",
    paymentStatusLabel: "Chờ thanh toán",
    itemCount: 0,
    total: 0,
    customerName: "Khách hàng Vision Direct",
    phone: "Chưa cập nhật",
    email: "Chưa cập nhật",
    shippingAddress: "Địa chỉ giao hàng sẽ được cập nhật sau.",
    createdAtLabel: new Intl.DateTimeFormat("vi-VN", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date()),
  };
}

function createPayOsFallbackOrderSummary() {
  return {
    orderId: 0,
    orderCreated: false,
    orderStatusLabel: "Chờ xác nhận",
    paymentMethod: "payos",
    paymentMethodLabel: "Thanh toán PayOS",
    paymentStatus: "pending",
    paymentStatusLabel: "Chờ thanh toán",
    itemCount: 0,
    total: 0,
    customerName: "Khách hàng Vision Direct",
    phone: "Chưa cập nhật",
    email: "Chưa cập nhật",
    shippingAddress: "Địa chỉ giao hàng sẽ được cập nhật sau.",
    createdAtLabel: new Intl.DateTimeFormat("vi-VN", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date()),
  };
}

function formatCurrency(value) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(Number(value ?? 0));
}


