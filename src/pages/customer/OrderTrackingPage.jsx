import { useState } from "react";
import { Link } from "react-router";
import {
  AlertCircle,
  ArrowLeft,
  Clock3,
  CreditCard,
  FileImage,
  MapPin,
  Package,
  Phone,
  RefreshCw,
  Truck,
  Upload,
} from "lucide-react";
import { useOrderTracking } from "@/hooks/order/useOrderTracking";

const INITIAL_RESUBMIT_FORM = {
  rightSph: "",
  rightCyl: "0",
  rightAxis: "0",
  leftSph: "",
  leftCyl: "0",
  leftAxis: "0",
  pd: "",
  notes: "",
};

export default function OrderTrackingPage() {
  const { order, prescriptionResubmit, authRequired, ui, actions } = useOrderTracking();
  const [resubmitForms, setResubmitForms] = useState({});
  const [resubmitFiles, setResubmitFiles] = useState({});
  const [resubmitValidationErrors, setResubmitValidationErrors] = useState({});

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
            <div className="mx-auto mb-4 h-12 w-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
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

  function getResubmitForm(prescription) {
    const key = String(prescription.prescriptionId);
    return (
      resubmitForms[key] ?? {
        ...INITIAL_RESUBMIT_FORM,
        rightSph: String(prescription.rightEye?.sph ?? ""),
        rightCyl: String(prescription.rightEye?.cyl ?? "0"),
        rightAxis: String(prescription.rightEye?.axis ?? "0"),
        leftSph: String(prescription.leftEye?.sph ?? ""),
        leftCyl: String(prescription.leftEye?.cyl ?? "0"),
        leftAxis: String(prescription.leftEye?.axis ?? "0"),
        pd: String(prescription.pd ?? ""),
        notes: "",
      }
    );
  }

  function updateResubmitField(prescriptionId, field, value) {
    const key = String(prescriptionId);
    const prescription = order.items.map((item) => item.prescription).find((item) => item?.prescriptionId === prescriptionId);

    clearResubmitFeedback(key);
    setResubmitForms((current) => ({
      ...current,
      [key]: {
        ...(current[key] ?? getResubmitForm(prescription)),
        [field]: value,
      },
    }));
  }

  async function handleResubmit(event, prescription) {
    event.preventDefault();

    const key = String(prescription.prescriptionId);
    const form = getResubmitForm(prescription);
    const validationMessage = validatePrescriptionForm(form);

    if (validationMessage) {
      setResubmitValidationErrors((current) => ({
        ...current,
        [key]: validationMessage,
      }));
      return;
    }

    try {
      const nextFile = resubmitFiles[key];
      clearResubmitFeedback(key);
      await actions.resubmitPrescription({
        prescriptionId: prescription.prescriptionId,
        formState: form,
        imageFile: nextFile,
        existingImageUrl: prescription.prescriptionImageUrl,
      });

      setResubmitFiles((current) => ({ ...current, [key]: null }));
    } catch (error) {
      setResubmitValidationErrors((current) => ({
        ...current,
        [key]: resolveErrorMessage(error, "Không thể gửi lại toa kính."),
      }));
    }
  }

  function clearResubmitFeedback(key) {
    setResubmitValidationErrors((current) => {
      if (!current[key]) {
        return current;
      }

      const next = { ...current };
      delete next[key];
      return next;
    });
    actions.clearPrescriptionResubmit(key);
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
            <div className="flex flex-wrap gap-2">
              <Badge tone={getOrderTone(order.orderStatus)}>{order.orderStatusLabel}</Badge>
              <Badge tone={getPaymentTone(order.payment?.paymentStatus)}>{order.payment?.paymentStatusLabel ?? "Chưa có thanh toán"}</Badge>
              <Badge tone={getShippingTone(order.shippingStatus)}>{order.shippingStatusLabel}</Badge>
            </div>
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
                      {history.note ? <p className="mt-2 text-sm leading-6 text-foreground/80">{history.note}</p> : null}
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
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
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
                      <p className="text-primary">{formatCurrency(item.lineTotal)}</p>
                    </div>

                    {item.prescription ? (
                      <PrescriptionPanel
                        item={item}
                        form={getResubmitForm(item.prescription)}
                        file={resubmitFiles[String(item.prescription.prescriptionId)]}
                        state={mergeResubmitState(
                          prescriptionResubmit[String(item.prescription.prescriptionId)],
                          resubmitValidationErrors[String(item.prescription.prescriptionId)],
                        )}
                        onFieldChange={updateResubmitField}
                        onFileChange={(file) => {
                          clearResubmitFeedback(String(item.prescription.prescriptionId));
                          setResubmitFiles((current) => ({
                            ...current,
                            [String(item.prescription.prescriptionId)]: file,
                          }));
                        }}
                        onSubmit={handleResubmit}
                      />
                    ) : null}
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
                <Row label="Tổng tiền" value={formatCurrency(order.totalAmount)} />
                <Row label="Trạng thái đơn" value={order.orderStatusLabel} />
                <Row label="Trạng thái giao" value={order.shippingStatusLabel} />
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
    </div>
  );
}

function PrescriptionPanel({ item, form, file, state, onFieldChange, onFileChange, onSubmit }) {
  const prescription = item.prescription;
  const needsMoreInfo = String(prescription.prescriptionStatus ?? "").toLowerCase() === "needmoreinfo";

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
        <Row label="Chất liệu" value={prescription.lensMaterial || "Mặc định"} />
      </div>

      {prescription.coatings.length > 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">Coating: {prescription.coatings.join(", ")}</p>
      ) : null}

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

      {needsMoreInfo ? (
        <form onSubmit={(event) => onSubmit(event, prescription)} className="mt-5 rounded-2xl bg-secondary/60 p-4">
          <div className="mb-4 flex items-center gap-2 text-sm text-amber-800">
            <RefreshCw className="h-4 w-4" />
            Bổ sung thông tin theo yêu cầu của staff.
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <Input label="SPH phải" value={form.rightSph} onChange={(value) => onFieldChange(prescription.prescriptionId, "rightSph", value)} />
            <Input label="CYL phải" value={form.rightCyl} onChange={(value) => onFieldChange(prescription.prescriptionId, "rightCyl", value)} />
            <Input label="AXIS phải" value={form.rightAxis} onChange={(value) => onFieldChange(prescription.prescriptionId, "rightAxis", value)} />
            <Input label="SPH trái" value={form.leftSph} onChange={(value) => onFieldChange(prescription.prescriptionId, "leftSph", value)} />
            <Input label="CYL trái" value={form.leftCyl} onChange={(value) => onFieldChange(prescription.prescriptionId, "leftCyl", value)} />
            <Input label="AXIS trái" value={form.leftAxis} onChange={(value) => onFieldChange(prescription.prescriptionId, "leftAxis", value)} />
          </div>

          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <Input label="PD" value={form.pd} onChange={(value) => onFieldChange(prescription.prescriptionId, "pd", value)} />
            <label className="block">
              <span className="mb-2 block text-sm">Ảnh mới</span>
              <span className="flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-white px-4 py-3 text-sm">
                <Upload className="h-4 w-4" />
                {file?.name || "Chọn ảnh"}
                <input type="file" accept="image/*" className="hidden" onChange={(event) => onFileChange(event.target.files?.[0] ?? null)} />
              </span>
            </label>
          </div>

          <label className="mt-3 block">
            <span className="mb-2 block text-sm">Ghi chú</span>
            <textarea
              value={form.notes}
              onChange={(event) => onFieldChange(prescription.prescriptionId, "notes", event.target.value)}
              rows={3}
              className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm outline-none focus:border-primary"
            />
          </label>

          {state?.error ? <p className="mt-3 text-sm text-red-600">{state.error}</p> : null}
          {state?.status === "succeeded" ? <p className="mt-3 text-sm text-emerald-700">Đã gửi lại toa kính.</p> : null}

          <button
            type="submit"
            disabled={state?.status === "loading"}
            className="mt-4 rounded-xl bg-primary px-5 py-3 text-sm text-white hover:bg-primary/90 disabled:opacity-60"
          >
            {state?.status === "loading" ? "Đang gửi..." : "Gửi lại toa kính"}
          </button>
        </form>
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

function Input({ label, value, onChange }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm">{label}</span>
      <input
        type="text"
        inputMode="decimal"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm outline-none focus:border-primary"
      />
    </label>
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
          <p className="mx-auto mb-8 max-w-2xl text-muted-foreground leading-7">{description}</p>
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

function getOrderTone(orderStatus) {
  switch (String(orderStatus ?? "").trim().toLowerCase()) {
    case "completed":
      return "bg-green-100 text-green-700";
    case "cancelled":
      return "bg-red-100 text-red-700";
    case "shipped":
      return "bg-blue-100 text-blue-700";
    default:
      return "bg-amber-100 text-amber-700";
  }
}

function getPaymentTone(paymentStatus) {
  switch (String(paymentStatus ?? "").trim().toLowerCase()) {
    case "completed":
      return "bg-green-100 text-green-700";
    case "failed":
      return "bg-red-100 text-red-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

function getShippingTone(shippingStatus) {
  switch (String(shippingStatus ?? "").trim().toLowerCase()) {
    case "delivered":
      return "bg-green-100 text-green-700";
    case "delivering":
    case "picking":
      return "bg-blue-100 text-blue-700";
    case "failed":
      return "bg-red-100 text-red-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

function getPrescriptionTone(status) {
  switch (String(status ?? "").trim().toLowerCase()) {
    case "approved":
    case "inproduction":
      return "bg-green-100 text-green-700";
    case "needmoreinfo":
      return "bg-amber-100 text-amber-700";
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

function validatePrescriptionForm(formState) {
  const values = [
    formState.rightSph,
    formState.rightCyl,
    formState.leftSph,
    formState.leftCyl,
    formState.pd,
  ];

  if (values.some((value) => !Number.isFinite(parseDecimal(value)))) {
    return "Vui lòng nhập đầy đủ thông số toa.";
  }

  const rightAxis = parseInteger(formState.rightAxis);
  const leftAxis = parseInteger(formState.leftAxis);

  if (!Number.isInteger(rightAxis) || rightAxis < 0 || rightAxis > 180 || !Number.isInteger(leftAxis) || leftAxis < 0 || leftAxis > 180) {
    return "AXIS phải nằm trong khoảng 0-180.";
  }

  if (parseDecimal(formState.pd) <= 0) {
    return "PD phải lớn hơn 0.";
  }

  return "";
}

function parseDecimal(value) {
  return Number.parseFloat(String(value ?? "").trim().replace(",", "."));
}

function parseInteger(value) {
  return Number.parseInt(String(value ?? "").trim(), 10);
}

function mergeResubmitState(remoteState, validationError) {
  if (validationError) {
    return {
      status: "failed",
      error: validationError,
    };
  }

  return remoteState;
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
  }).format(date);
}
