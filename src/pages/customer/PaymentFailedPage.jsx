import { Link, useLocation } from "react-router";
import {
  AlertTriangle,
  ArrowLeft,
  CreditCard,
  RefreshCcw,
  ShieldAlert,
  ShoppingBag,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useCart } from "@/hooks/cart/useCart";
import { usePayOsCallback } from "@/hooks/order/usePayOsCallback";
import { createPayment } from "@/services/paymentService";
import { selectAuthState } from "@/store/auth/authSlice";
import { clearPendingPayOsCart, loadPendingPayOsCart } from "@/store/cart/cartStorage";
import { useAppSelector } from "@/store/hooks";

export default function PaymentFailedPage() {
  const location = useLocation();
  const auth = useAppSelector(selectAuthState);
  const cart = useCart();
  const restoreAttemptedRef = useRef(false);
  const [retryState, setRetryState] = useState({
    status: "idle",
    error: null,
  });
  const fallbackOrderSummary =
    location.state?.orderSummary ??
    (location.search ? createPayOsFallbackOrderSummary() : createFallbackOrderSummary());
  const {
    authRequired,
    callback,
    isExternalCallback,
    lookup,
    orderSummary,
  } = usePayOsCallback(fallbackOrderSummary);
  const resolvedOrderSummary = orderSummary ?? fallbackOrderSummary;
  const errorMessage =
    location.state?.errorMessage ??
    lookup.error ??
    getDefaultFailureMessage(callback);
  const orderCreated = Boolean(location.state?.orderCreated ?? resolvedOrderSummary.orderCreated);
  const orderStatus = normalizeOrderStatus(resolvedOrderSummary.orderStatus);
  const paymentStatus = normalizePaymentStatus(resolvedOrderSummary.paymentStatus);
  const canceledByUserAtPayOs = callback?.cancel || callback?.status === "CANCELLED";
  const orderCanceled = orderStatus === "cancelled";
  const canTrackOrder = Number(resolvedOrderSummary.orderId ?? 0) > 0;
  const canRetryPayment =
    orderCreated
    && canTrackOrder
    && normalizePaymentMethod(resolvedOrderSummary.paymentMethod) === "payos"
    && Number(resolvedOrderSummary.total ?? 0) > 0
    && !orderCanceled
    && paymentStatus !== "completed";
  const isRetrying = retryState.status === "loading";

  useEffect(() => {
    if (restoreAttemptedRef.current || !auth.isReady || !auth.accessToken || cart.status !== "succeeded") {
      return;
    }

    if (normalizePaymentMethod(resolvedOrderSummary.paymentMethod) !== "payos") {
      return;
    }

    const pendingCart = loadPendingPayOsCart();

    if (!pendingCart?.items?.length) {
      return;
    }

    restoreAttemptedRef.current = true;

    if (cart.items.length > 0) {
      clearPendingPayOsCart();
      return;
    }

    async function restoreCart() {
      try {
        for (const item of pendingCart.items) {
          if (item.itemType === "prescriptionConfigured") {
            await cart.addPrescriptionItem(item);
          } else {
            await cart.addStandardItem(item);
          }
        }

        clearPendingPayOsCart();
        toast.success("Đã khôi phục giỏ hàng sau khi thanh toán chưa hoàn tất.");
      } catch (error) {
        toast.error(resolveErrorMessage(error, "Không thể khôi phục giỏ hàng sau khi thanh toán chưa hoàn tất."));
      }
    }

    void restoreCart();
  }, [auth.accessToken, auth.isReady, cart, resolvedOrderSummary.paymentMethod]);

  async function handleRetryPayment() {
    if (!canRetryPayment || isRetrying) {
      return;
    }

    if (!auth.accessToken) {
      setRetryState({
        status: "failed",
        error: "Vui lòng đăng nhập lại để mở thanh toán PayOS cho đơn đã tạo.",
      });
      return;
    }

    setRetryState({
      status: "loading",
      error: null,
    });

    try {
      const payment = await createPayment(auth.accessToken, {
        orderId: Number(resolvedOrderSummary.orderId),
        amount: Number(resolvedOrderSummary.total),
        paymentMethod: "payos",
      });
      const payUrl = payment?.payUrl || payment?.deeplink || payment?.qrCodeUrl;

      if (!payUrl) {
        throw new Error("Backend chưa trả về liên kết thanh toán PayOS mới cho đơn này.");
      }

      window.location.assign(payUrl);
    } catch (error) {
      setRetryState({
        status: "failed",
        error: resolveErrorMessage(error, "Không thể mở lại thanh toán PayOS cho đơn đã tạo."),
      });
    }
  }

  if (authRequired) {
    return (
      <CallbackStateCard
        title="Cần đăng nhập để xem kết quả PayOS"
        description="PayOS đã chuyển bạn về website, nhưng hệ thống cần xác thực lại tài khoản để tải trạng thái đơn hàng."
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
        description="Hệ thống đang kiểm tra trạng thái giao dịch PayOS và cập nhật lại đơn hàng."
        loading
      />
    );
  }

  return (
    <div className="min-h-screen bg-secondary/30 py-12">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-[28px] border border-border bg-white shadow-sm">
          <div className="border-b border-border bg-[linear-gradient(135deg,#fff7f5_0%,#fff_55%,#fff9ef_100%)] px-8 py-12 text-center">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-orange-100 text-orange-600">
              <AlertTriangle className="h-10 w-10" />
            </div>
            <p className="mb-3 text-sm uppercase tracking-[0.24em] text-orange-700">
              Thanh toán chưa hoàn tất
            </p>
            <h1 className="mb-3 text-3xl">
              {!orderCreated
                ? "Tạo đơn hàng thất bại"
                : orderCanceled
                  ? `Đơn #${resolvedOrderSummary.orderId} đã hủy`
                  : canceledByUserAtPayOs
                    ? "Bạn đã hủy thanh toán PayOS"
                    : "Đơn hàng đang chờ thanh toán"}
            </h1>
            <p className="mx-auto max-w-2xl text-muted-foreground leading-7">{errorMessage}</p>
          </div>

          <div className="grid gap-0 lg:grid-cols-[1.45fr_1fr]">
            <div className="border-b border-border p-8 lg:border-b-0 lg:border-r">
              <div className="mb-8 grid gap-4 sm:grid-cols-2">
                <InfoCard
                  icon={CreditCard}
                  label="Phương thức đã chọn"
                  value={resolvedOrderSummary.paymentMethodLabel}
                />
                <InfoCard
                  icon={ShoppingBag}
                  label="Giá trị đơn hàng"
                  value={formatCurrency(resolvedOrderSummary.total)}
                />
                <InfoCard
                  icon={ShieldAlert}
                  label="Trạng thái đơn"
                  value={
                    !orderCreated
                      ? "Chưa tạo được đơn"
                      : orderCanceled
                        ? `Đã hủy đơn #${resolvedOrderSummary.orderId}`
                        : `${resolvedOrderSummary.orderStatusLabel || "Đang xử lý"} · Đơn #${resolvedOrderSummary.orderId}`
                  }
                />
                <InfoCard
                  icon={RefreshCcw}
                  label="Bước nên làm"
                  value={
                    canRetryPayment
                      ? "Thanh toán lại ngay cho đơn hiện tại"
                      : orderCreated
                        ? "Quay lại giỏ hàng hoặc checkout lại"
                        : "Kiểm tra giỏ hàng và thử lại"
                  }
                />
              </div>

              <div className="mb-6 rounded-2xl border border-border p-6">
                <h2 className="mb-4 text-lg">Lưu ý hiện tại</h2>
                <div className="space-y-3 text-sm text-muted-foreground">
                  <p>
                    {!orderCreated
                      ? "Giỏ hàng vẫn giữ nguyên để bạn thử lại."
                      : orderCanceled
                        ? "Đơn hàng đã hủy. Giỏ hàng sẽ được khôi phục để bạn thử lại."
                        : canRetryPayment
                          ? "Đơn hàng vẫn còn hiệu lực. Bạn có thể mở lại PayOS để thanh toán ngay đơn này."
                          : "Đơn hàng đã tạo nhưng hiện chưa thể mở lại thanh toán tự động."}
                  </p>
                  <p>Thông báo chi tiết: {errorMessage}</p>
                  <p>Nếu cần, bạn có thể quay lại checkout để nhập lại thông tin hoặc chọn phương thức khác.</p>
                </div>
              </div>

              <div className="rounded-2xl bg-secondary/60 p-6">
                <h2 className="mb-4 text-lg">Thông tin tạm thời</h2>
                <div className="space-y-2 text-sm text-foreground/90">
                  <p>Khách hàng: {resolvedOrderSummary.customerName}</p>
                  <p>Số điện thoại: {resolvedOrderSummary.phone}</p>
                  <p>Địa chỉ: {resolvedOrderSummary.shippingAddress}</p>
                  <p>Tổng giá trị: {formatCurrency(resolvedOrderSummary.total)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-8">
              <div className="mb-6 rounded-2xl bg-secondary/60 p-6">
                <p className="mb-2 text-sm text-muted-foreground">Bạn có thể làm gì tiếp theo?</p>
                <div className="space-y-3 text-sm text-foreground/90">
                  <p>Kiểm tra lại thông tin giao hàng và phương thức thanh toán.</p>
                  <p>
                    {canRetryPayment
                      ? "Mở lại thanh toán PayOS cho đơn đã tạo, không cần tạo lại cart."
                      : "Quay lại checkout để tạo lại đơn tương tự."}
                  </p>
                  <p>Hoặc mở giỏ hàng để điều chỉnh sản phẩm.</p>
                </div>
              </div>

              {retryState.error ? (
                <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700">
                  {retryState.error}
                </div>
              ) : null}

              <div className="space-y-3">
                {canRetryPayment ? (
                  <button
                    type="button"
                    onClick={handleRetryPayment}
                    disabled={isRetrying}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isRetrying ? "Đang mở lại PayOS..." : "Thử lại thanh toán PayOS"}
                    <RefreshCcw className={`h-4 w-4 ${isRetrying ? "animate-spin" : ""}`} />
                  </button>
                ) : (
                  <Link
                    to="/checkout"
                    className="flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-white transition-colors hover:bg-primary/90"
                  >
                    Thử lại thanh toán
                    <RefreshCcw className="h-4 w-4" />
                  </Link>
                )}
                <Link
                  to="/cart"
                  className="flex items-center justify-center gap-2 rounded-xl border border-border px-5 py-3 transition-colors hover:bg-secondary"
                >
                  Quay về giỏ hàng
                </Link>
                {orderCreated && canTrackOrder ? (
                  <Link
                    to={`/orders/${resolvedOrderSummary.orderId}`}
                    className="flex items-center justify-center gap-2 rounded-xl border border-border px-5 py-3 transition-colors hover:bg-secondary"
                  >
                    Xem đơn hàng đã tạo
                  </Link>
                ) : null}
                <Link
                  to="/shop"
                  className="flex items-center justify-center gap-2 rounded-xl border border-border px-5 py-3 transition-colors hover:bg-secondary"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Tiếp tục mua sắm
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
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-orange-100 text-orange-600">
              <ShieldAlert className="h-10 w-10" />
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

function InfoCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-border bg-white p-5">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 text-orange-600">
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
    paymentMethod: null,
    paymentMethodLabel: "Thanh toán online",
    paymentStatus: "failed",
    total: 0,
    customerName: "Khách hàng Vision Direct",
    phone: "Chưa cập nhật",
    shippingAddress: "Địa chỉ giao hàng sẽ được cập nhật sau.",
  };
}

function createPayOsFallbackOrderSummary() {
  return {
    orderId: 0,
    orderCreated: false,
    paymentMethod: "payos",
    paymentMethodLabel: "Thanh toán PayOS",
    paymentStatus: "failed",
    total: 0,
    customerName: "Khách hàng Vision Direct",
    phone: "Chưa cập nhật",
    shippingAddress: "Địa chỉ giao hàng sẽ được cập nhật sau.",
  };
}

function getDefaultFailureMessage(callback) {
  if (callback?.cancel || callback?.status === "CANCELLED") {
    return "Thanh toán PayOS đã bị hủy. Bạn có thể thử lại bất cứ lúc nào.";
  }

  return "Hệ thống chưa thể hoàn tất bước thanh toán. Bạn có thể thử lại ngay khi sẵn sàng.";
}

function formatCurrency(value) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(Number(value ?? 0));
}

function normalizePaymentMethod(paymentMethod) {
  return String(paymentMethod ?? "").trim().toLowerCase();
}

function normalizeOrderStatus(orderStatus) {
  return String(orderStatus ?? "").trim().toLowerCase();
}

function normalizePaymentStatus(paymentStatus) {
  return String(paymentStatus ?? "").trim().toLowerCase();
}

function resolveErrorMessage(error, fallbackMessage) {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  if (typeof error === "string" && error.trim().length > 0) {
    return error;
  }

  return fallbackMessage;
}


