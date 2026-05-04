import { useState } from "react";
import { Link } from "react-router";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Clock3,
  CreditCard,
  FileImage,
  MapPin,
  Package,
  Phone,
  Truck,
  X,
} from "lucide-react";
import { useOrderTracking } from "@/hooks/order/useOrderTracking";
import { canCustomerCancelOrder } from "@/utils/orderWorkflowPolicy";

export default function OrderTrackingPage() {
  const { order, authRequired, ui, actions } = useOrderTracking();
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelError, setCancelError] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);

  if (authRequired) {
    return (
      <StateCard
        icon={Package}
        title="Cần đăng nhập để xem đơn hàng"
        description="Chi tiết đơn hàng chỉ hiển thị cho tài khoản đã đăng nhập."
        primaryAction={{ label: "Đăng nhập", to: "/login" }}
        secondaryAction={{ label: "Quay lại cửa hàng", to: "/shop" }}
      />
    );
  }

  if (ui.isLoading) {
    return (
      <div className="min-h-screen bg-secondary/30 py-12">
        <div className="mx-auto flex max-w-5xl items-center justify-center px-4">
          <div className="rounded-[28px] border border-border bg-white px-8 py-16 text-center shadow-sm">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
            <p className="text-muted-foreground">Đang tải chi tiết đơn hàng...</p>
          </div>
        </div>
      </div>
    );
  }

  if (ui.error || !order) {
    return (
      <div className="min-h-screen bg-secondary/30 py-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-[28px] border border-border bg-white p-8 shadow-sm">
            <div className="mb-6 flex items-start gap-4 rounded-2xl border border-red-200 bg-red-50 p-5">
              <AlertCircle className="mt-0.5 h-6 w-6 shrink-0 text-red-600" />
              <div>
                <h1 className="mb-2 text-2xl">Không thể mở đơn hàng</h1>
                <p className="text-sm leading-6 text-red-700">{ui.error || "Chi tiết đơn hàng chưa sẵn sàng."}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={actions.retry}
                className="rounded-xl bg-primary px-5 py-3 text-white transition-colors hover:bg-primary/90"
              >
                Tải lại
              </button>
              <Link to="/shop" className="rounded-xl border border-border px-5 py-3 transition-colors hover:bg-secondary">
                Quay lại cửa hàng
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const cancelAvailable = canCustomerCancelOrder(order);
  const subtotal = order.items.reduce((sum, item) => sum + Number(item.lineTotal ?? 0), 0);
  const shippingFee = Math.max(0, Number(order.shippingFee ?? 0));
  const voucherDiscountAmount = Math.max(0, Number(order.voucherDiscountAmount ?? 0));

  function openCancelModal() {
    setCancelReason("");
    setCancelError("");
    setIsCancelModalOpen(true);
  }

  function closeCancelModal() {
    if (isCancelling) {
      return;
    }

    setIsCancelModalOpen(false);
    setCancelError("");
  }

  async function handleConfirmCancelOrder() {
    try {
      setIsCancelling(true);
      setCancelError("");
      await actions.cancelOrder(cancelReason.trim());
      setIsCancelModalOpen(false);
      setCancelReason("");
    } catch (error) {
      setCancelError(resolveErrorMessage(error, "Không thể hủy đơn hàng."));
    } finally {
      setIsCancelling(false);
    }
  }

  return (
    <div className="min-h-screen bg-secondary/30 py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <Link to="/shop" className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Quay lại cửa hàng
        </Link>

        <div className="mb-8 rounded-[28px] border border-border bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="mb-2 text-sm uppercase tracking-[0.24em] text-muted-foreground">{order.orderTypeLabel}</p>
              <h1 className="mb-2 text-3xl">Đơn hàng #{order.orderId}</h1>
              <p className="text-muted-foreground">Đặt lúc {order.createdAtLabel}</p>
            </div>
            {cancelAvailable ? (
              <button
                type="button"
                onClick={openCancelModal}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-600 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-rose-700"
              >
                <AlertTriangle className="h-4 w-4" />
                Hủy đơn
              </button>
            ) : (
              <div className="inline-flex items-center justify-center rounded-xl border border-border bg-secondary px-4 py-2.5 text-sm text-muted-foreground">
                {getCancelUnavailableLabel(order.orderStatus)}
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.35fr_0.9fr]">
          <div className="space-y-8">
            <section className="rounded-[28px] border border-border bg-white p-8 shadow-sm">
              <SectionTitle icon={Clock3} title="Lịch sử trạng thái" subtitle="Cập nhật mới nhất của đơn hàng." />

              <div className="space-y-5">
                {(order.statusHistory.length > 0 ? order.statusHistory : [createFallbackHistory(order)]).map((history, index, items) => (
                  <div key={history.historyId || `${history.orderStatus}-${index}`} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`h-11 w-11 rounded-full ${getOrderTimelineTone(history.orderStatus)}`}>
                        <div className="flex h-full w-full items-center justify-center">
                          <Package className="h-5 w-5" />
                        </div>
                      </div>
                      {index < items.length - 1 ? <div className="mt-2 h-full w-px bg-border" /> : null}
                    </div>
                    <div className="flex-1 pb-6">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p>{history.orderStatusLabel}</p>
                        <span className="text-sm text-muted-foreground">{history.updatedAtLabel}</span>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">Cập nhật bởi: {history.updatedByName}</p>
                      {history.note ? <p className="mt-2 text-sm leading-6 text-foreground/80">{translateOrderHistoryNote(history.note)}</p> : null}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[28px] border border-border bg-white p-8 shadow-sm">
              <SectionTitle icon={Package} title="Sản phẩm trong đơn" subtitle={`${order.itemCount} sản phẩm từ checkout.`} />

              <div className="space-y-4">
                {order.items.map((item) => (
                  <div key={item.orderItemId} className="rounded-2xl bg-secondary/60 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <p>{item.productName}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          SKU {item.sku || "Đang cập nhật"} - Màu {item.selectedColor}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">Số lượng {item.quantity}</p>
                        {order.orderType === "preOrder" ? (
                          <div className="mt-2 rounded-xl border border-orange-200 bg-orange-50 px-3 py-2 text-sm text-orange-900">
                            <p>Đơn đặt trước đang chờ hàng về kho.</p>
                            {item.expectedRestockDate ? <p>Dự kiến có hàng: {formatDate(item.expectedRestockDate)}</p> : null}
                            {item.preOrderNote ? <p>{item.preOrderNote}</p> : null}
                          </div>
                        ) : null}
                      </div>
                      <p className="shrink-0 whitespace-nowrap text-primary">{formatCurrency(item.lineTotal)}</p>
                    </div>

                    {item.prescription ? <PrescriptionPanel item={item} /> : null}
                  </div>
                ))}
              </div>
            </section>
          </div>

          <aside className="space-y-8">
            <section className="rounded-[28px] border border-border bg-white p-8 shadow-sm">
              <SectionTitle icon={MapPin} title="Thông tin giao hàng" subtitle="Người nhận và địa chỉ đã lưu." />

              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <Package className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div>
                    <p>{order.receiverName}</p>
                    <p className="text-muted-foreground">{order.shippingAddress}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <p>{order.receiverPhone}</p>
                </div>
                {order.shippingCode ? (
                  <div className="flex items-start gap-3">
                    <Truck className="mt-0.5 h-4 w-4 text-muted-foreground" />
                    <div>
                      <p>Mã vận đơn</p>
                      <p className="text-muted-foreground">{order.shippingCode}</p>
                    </div>
                  </div>
                ) : null}
              </div>
            </section>

            <section className="rounded-[28px] border border-border bg-white p-8 shadow-sm">
              <SectionTitle icon={CreditCard} title="Thanh toán" subtitle="Thông tin thanh toán hiện tại." />

              <div className="space-y-3 text-sm">
                <Row label="Tạm tính" value={formatCurrency(subtotal)} />
                <Row label="Phí ship" value={shippingFee > 0 ? formatCurrency(shippingFee) : "Miễn phí"} />
                {voucherDiscountAmount > 0 ? (
                  <Row label="Giảm từ voucher" value={`-${formatCurrency(voucherDiscountAmount)}`} />
                ) : null}
                <Row label="Tổng tiền" value={formatCurrency(order.totalAmount)} />
                <Row label="Trạng thái đơn" value={order.orderStatusLabel} />
                <Row label="Cập nhật cuối" value={order.updatedAtLabel} />
                {order.payment ? (
                  <>
                    <Row label="Payment" value={order.payment.paymentMethodLabel} />
                    <Row label="Trạng thái thanh toán" value={order.payment.paymentStatusLabel} />
                    <Row label="Thanh toán lúc" value={order.payment.paidAtLabel} />
                  </>
                ) : (
                  <Row label="Payment" value="Chưa có bản ghi thanh toán" />
                )}
              </div>
            </section>
          </aside>
        </div>
      </div>

      <CancelOrderModal
        open={isCancelModalOpen}
        isSubmitting={isCancelling}
        reason={cancelReason}
        error={cancelError}
        onReasonChange={setCancelReason}
        onClose={closeCancelModal}
        onConfirm={handleConfirmCancelOrder}
      />
    </div>
  );
}

function CancelOrderModal({ open, isSubmitting, reason, error, onReasonChange, onClose, onConfirm }) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl">Xác nhận hủy đơn</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Đơn sẽ được hủy theo chính sách hiện tại. Bạn có thể nhập lý do để hệ thống lưu lại lịch sử.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <label className="mb-2 block text-sm font-medium">Lý do hủy (tùy chọn)</label>
        <textarea
          value={reason}
          onChange={(event) => onReasonChange(event.target.value)}
          rows={4}
          maxLength={255}
          placeholder="Ví dụ: Muốn đổi sản phẩm khác, đổi địa chỉ giao hàng..."
          className="w-full resize-none rounded-xl border border-border bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-rose-400"
        />

        {error ? (
          <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="mt-5 flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-secondary disabled:opacity-60"
          >
            Đóng
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-rose-700 disabled:opacity-60"
          >
            {isSubmitting ? "Đang hủy..." : "Xác nhận hủy đơn"}
          </button>
        </div>
      </div>
    </div>
  );
}

function PrescriptionPanel({ item }) {
  const prescription = item.prescription;

  return (
    <div className="mt-4 rounded-2xl border border-primary/20 bg-white p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-medium">Prescription #{prescription.prescriptionId}</p>
          <p className="text-sm text-muted-foreground">
            {prescription.lensTypeCode || `Lens #${prescription.lensTypeId}`} / {formatCurrency(prescription.totalLensPrice)}
          </p>
        </div>
        <Badge tone={getPrescriptionTone(prescription.prescriptionStatus)}>{prescription.prescriptionStatusLabel}</Badge>
      </div>

      <div className="grid gap-3 text-sm md:grid-cols-2">
        <EyeSummary title="Mắt phải" eye={prescription.rightEye} />
        <EyeSummary title="Mắt trái" eye={prescription.leftEye} />
      </div>

      <div className="mt-3 grid gap-3 text-sm md:grid-cols-2">
        <Row label="PD" value={`${prescription.pd} mm`} />
        <Row label="Loại tròng" value={prescription.lensTypeCode || `Lens #${prescription.lensTypeId}`} />
      </div>

      {prescription.notes ? (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          {prescription.notes}
        </div>
      ) : null}

      {prescription.prescriptionImageUrl ? (
        <a
          href={prescription.prescriptionImageUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex items-center gap-2 text-sm text-primary hover:underline"
        >
          <FileImage className="h-4 w-4" />
          Mở ảnh toa
        </a>
      ) : null}
    </div>
  );
}

function SectionTitle({ icon: Icon, title, subtitle }) {
  return (
    <div className="mb-6 flex items-center gap-3">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <h2 className="text-xl">{title}</h2>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
}

function EyeSummary({ title, eye }) {
  return (
    <div className="rounded-xl bg-secondary/70 p-3">
      <p className="mb-2 font-medium">{title}</p>
      <p>SPH {eye?.sph ?? 0}</p>
      <p>CYL {eye?.cyl ?? 0}</p>
      <p>AXIS {eye?.axis ?? 0}</p>
    </div>
  );
}

function Badge({ tone, children }) {
  return <span className={`rounded-full px-3 py-1 text-sm ${tone}`}>{children}</span>;
}

function Row({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right">{value}</span>
    </div>
  );
}

function StateCard({ icon: Icon, title, description, primaryAction, secondaryAction }) {
  return (
    <div className="min-h-screen bg-secondary/30 py-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-[28px] border border-border bg-white px-8 py-16 text-center shadow-sm">
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Icon className="h-10 w-10" />
          </div>
          <h1 className="mb-3 text-3xl">{title}</h1>
          <p className="mx-auto mb-8 max-w-2xl leading-7 text-muted-foreground">{description}</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to={primaryAction.to} className="rounded-xl bg-primary px-5 py-3 text-white transition-colors hover:bg-primary/90">
              {primaryAction.label}
            </Link>
            <Link to={secondaryAction.to} className="rounded-xl border border-border px-5 py-3 transition-colors hover:bg-secondary">
              {secondaryAction.label}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function createFallbackHistory(order) {
  return {
    historyId: 0,
    orderStatus: order.orderStatus,
    orderStatusLabel: order.orderStatusLabel,
    updatedByName: "Hệ thống",
    note: "",
    updatedAtLabel: order.updatedAtLabel,
  };
}

function translateOrderHistoryNote(note) {
  const cleanedNote = stripPaymentReconcileTag(String(note ?? "").trim());
  const normalized = cleanedNote.toLowerCase();

  if (normalized === "order created." || normalized === "order created") {
    return "Đơn hàng đã được tạo.";
  }

  if (
    normalized === "order cancelled by customer."
    || normalized === "order cancelled by customer"
    || normalized === "order canceled by customer."
    || normalized === "order canceled by customer"
  ) {
    return "Đơn hàng đã bị khách hàng hủy.";
  }

  if (
    normalized === "order cancelled automatically because online payment failed (payment:reconcile)."
    || normalized === "order cancelled automatically because online payment failed (payment:reconcile)"
    || normalized === "order canceled automatically because online payment failed (payment:reconcile)."
    || normalized === "order canceled automatically because online payment failed (payment:reconcile)"
  ) {
    return "Đơn hàng đã tự động hủy do thanh toán online thất bại.";
  }

  if (normalized === "payment created." || normalized === "payment created") {
    return "Thanh toán đã được tạo.";
  }

  if (normalized === "order moved to awaiting stock." || normalized === "order moved to awaiting stock") {
    return "Đơn hàng đã chuyển sang trạng thái chờ hàng.";
  }

  if (
    normalized === "order moved to processing automatically after stock receipt and back-in-stock email."
    || normalized === "order moved to processing automatically after stock receipt and back-in-stock email"
    || normalized === "order moved to processing automatically after stock receipt and back in stock email."
    || normalized === "order moved to processing automatically after stock receipt and back in stock email"
    || normalized === "order moved to processing automatically after stock receipt and basic-stock email."
    || normalized === "order moved to processing automatically after stock receipt and basic-stock email"
    || normalized === "order moved to processing automatically after stock receipt and basic stock email."
    || normalized === "order moved to processing automatically after stock receipt and basic stock email"
  ) {
    return "Đơn hàng đã tự động chuyển sang đang xử lý sau khi nhập kho và gửi email thông báo có hàng.";
  }

  return cleanedNote;
}

function stripPaymentReconcileTag(note) {
  return String(note ?? "")
    .replace(/\s*\(payment:reconcile\)\.?/gi, "")
    .trim();
}

function getPrescriptionTone(status) {
  switch (String(status ?? "").trim().toLowerCase()) {
    case "approved":
      return "bg-green-100 text-green-700";
    case "rejected":
      return "bg-red-100 text-red-700";
    default:
      return "bg-blue-100 text-blue-700";
  }
}

function getOrderTimelineTone(orderStatus) {
  switch (String(orderStatus ?? "").trim().toLowerCase()) {
    case "completed":
      return "bg-green-100 text-green-700";
    case "cancelled":
      return "bg-red-100 text-red-700";
    case "shipped":
      return "bg-blue-100 text-blue-700";
    default:
      return "bg-primary/10 text-primary";
  }
}

function getCancelUnavailableLabel(orderStatus) {
  switch (String(orderStatus ?? "").trim().toLowerCase()) {
    case "cancelled":
      return "Đơn đã hủy";
    case "completed":
      return "Đơn đã hoàn tất";
    default:
      return "Không thể hủy ở trạng thái này";
  }
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

function formatCurrency(value) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(Number(value ?? 0));
}

function formatDate(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "chưa cập nhật";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(date);
}
