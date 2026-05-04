import { Link, useLocation } from "react-router";
import { Check, Eye, FileText, Image as ImageIcon, Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useStaffPrescriptionReview } from "@/hooks/prescription/useStaffPrescriptionReview";

const STATUS_PRESENTATIONS = {
  submitted: {
    label: "Chờ kiểm tra",
    className: "border border-amber-200 bg-amber-50 text-amber-700",
  },
  reviewing: {
    label: "Đang kiểm tra",
    className: "border border-sky-200 bg-sky-50 text-sky-700",
  },
  approved: {
    label: "Đã duyệt",
    className: "border border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  rejected: {
    label: "Từ chối",
    className: "border border-rose-200 bg-rose-50 text-rose-700",
  },
};

const STATUS_FILTERS = [
  { value: "", label: "Tất cả" },
  { value: "submitted", label: STATUS_PRESENTATIONS.submitted.label },
  { value: "reviewing", label: STATUS_PRESENTATIONS.reviewing.label },
  { value: "approved", label: STATUS_PRESENTATIONS.approved.label },
  { value: "rejected", label: STATUS_PRESENTATIONS.rejected.label },
];

function StaffPrescriptionReviewPage() {
  const {
    items,
    selectedId,
    detail,
    relatedOrder,
    searchQuery,
    filterStatus,
    actionNote,
    pendingCount,
    ui,
    actions,
  } = useStaffPrescriptionReview();
  const location = useLocation();
  const orderBasePath = location.pathname.startsWith("/admin") ? "/admin/orders" : "/staff/orders";
  const [previewImageUrl, setPreviewImageUrl] = useState("");
  const [hasAppliedQuerySelection, setHasAppliedQuerySelection] = useState(false);

  useEffect(() => {
    setHasAppliedQuerySelection(false);
  }, [location.search]);

  useEffect(() => {
    if (hasAppliedQuerySelection) {
      return;
    }

    const queryPrescriptionId = Number(new URLSearchParams(location.search).get("prescriptionId") ?? 0);

    if (!Number.isFinite(queryPrescriptionId) || queryPrescriptionId <= 0) {
      setHasAppliedQuerySelection(true);
      return;
    }

    if (!Array.isArray(items) || items.length === 0) {
      return;
    }

    const matchedItem = items.find((item) => Number(item.prescriptionId) === queryPrescriptionId);
    if (matchedItem) {
      actions.setSelectedId(matchedItem.prescriptionId);
    }

    setHasAppliedQuerySelection(true);
  }, [actions, hasAppliedQuerySelection, items, location.search]);

  return (
    <div className="min-h-screen bg-[#fffaf2]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 rounded-[28px] border border-border bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Eye className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-3xl">Kiểm tra toa kính</h1>
                <p className="text-sm text-muted-foreground">{pendingCount} toa đang cần xử lý</p>
              </div>
            </div>
            <button
              type="button"
              onClick={actions.loadList}
              disabled={ui.isListLoading}
              className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-3 text-sm hover:bg-secondary disabled:opacity-60"
            >
              Tải lại
            </button>
          </div>
        </div>

        <div className="mb-6 rounded-[28px] border border-border bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Tìm theo mã đơn, mã toa, khách hàng"
                value={searchQuery}
                onChange={(event) => actions.setSearchQuery(event.target.value)}
                className="w-full rounded-xl border border-border bg-background py-3 pl-12 pr-4 outline-none focus:border-primary"
              />
            </div>

            <select
              value={filterStatus}
              onChange={(event) => actions.setFilterStatus(event.target.value)}
              className="rounded-xl border border-border bg-background px-4 py-3 outline-none focus:border-primary"
            >
              {STATUS_FILTERS.map((status) => (
                <option key={status.value || "all"} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {ui.listError ? (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{ui.listError}</div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.5fr]">
          <div className="space-y-3">
            {ui.isListLoading ? (
              <LoadingCard text="Đang tải danh sách..." />
            ) : items.length === 0 ? (
              <EmptyCard text="Không có toa kính phù hợp." />
            ) : (
              items.map((item) => (
                <button
                  key={item.prescriptionId}
                  type="button"
                  onClick={() => actions.setSelectedId(item.prescriptionId)}
                  className={`w-full rounded-2xl border p-4 text-left transition-colors ${
                    selectedId === item.prescriptionId ? "border-primary bg-primary/5" : "border-border bg-white hover:border-primary/40"
                  }`}
                >
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">Toa #{item.prescriptionId}</p>
                      <p className="text-sm text-muted-foreground">Đơn #{item.orderId || "N/A"}</p>
                    </div>
                    <StatusBadge status={item.prescriptionStatus} label={item.prescriptionStatusLabel} />
                  </div>
                  <p className="text-sm">{item.customerName}</p>
                  <p className="text-xs text-muted-foreground">{item.customerEmail}</p>
                  <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{item.lensTypeCode || `Tròng #${item.lensTypeId}`}</span>
                    {item.prescriptionImageUrl ? (
                      <span className="inline-flex items-center gap-1 text-primary">
                        <ImageIcon className="h-3.5 w-3.5" />
                        Có ảnh
                      </span>
                    ) : null}
                  </div>
                </button>
              ))
            )}
          </div>

          <div>
            {ui.isDetailLoading ? (
              <LoadingCard text="Đang tải chi tiết..." />
            ) : detail ? (
              <DetailPanel
                detail={detail}
                actionNote={actionNote}
                setActionNote={actions.setActionNote}
                actionError={ui.actionError}
                saving={ui.isSaving}
                relatedOrder={relatedOrder}
                isRelatedOrderLoading={ui.isRelatedOrderLoading}
                relatedOrderError={ui.relatedOrderError}
                orderBasePath={orderBasePath}
                onReview={actions.review}
                onOpenImagePreview={setPreviewImageUrl}
              />
          ) : (
              <EmptyCard text="Chọn một toa kính để kiểm tra." />
            )}
          </div>
        </div>
      </div>

      {previewImageUrl ? (
        <button
          type="button"
          onClick={() => setPreviewImageUrl("")}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
        >
          <img
            src={previewImageUrl}
            alt="Anh toa"
            onClick={(event) => event.stopPropagation()}
            className="max-h-[90vh] max-w-[90vw] rounded-xl border border-white/20 bg-white object-contain shadow-2xl"
          />
        </button>
      ) : null}
    </div>
  );
}

function DetailPanel({
  detail,
  actionNote,
  setActionNote,
  actionError,
  saving,
  relatedOrder,
  isRelatedOrderLoading,
  relatedOrderError,
  orderBasePath,
  onReview,
  onOpenImagePreview,
}) {
  const status = normalizeStatus(detail.prescriptionStatus);

  return (
    <div className="overflow-hidden rounded-[28px] border border-border bg-white shadow-sm">
      <div className="border-b border-border bg-secondary/50 p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-2xl">Toa #{detail.prescriptionId}</h2>
            <p className="mt-1 text-sm text-muted-foreground">Đơn #{detail.orderId || "N/A"}</p>
            <p className="mt-3">{detail.customerName}</p>
            <p className="text-sm text-muted-foreground">{detail.customerEmail}</p>
          </div>
          <StatusBadge status={detail.prescriptionStatus} label={detail.prescriptionStatusLabel} />
        </div>
      </div>

      <div className="space-y-6 p-6">
        <section>
          <SectionTitle icon={FileText} title="Thông số toa" />
          <div className="grid gap-4 md:grid-cols-2">
            <EyeCard title="Mắt phải" eye={detail.rightEye} />
            <EyeCard title="Mắt trái" eye={detail.leftEye} />
          </div>
          <div className="mt-4 rounded-2xl bg-secondary/60 p-4">
            <Row label="PD" value={`${detail.pd} mm`} />
          </div>
        </section>

        <section>
          <SectionTitle icon={FileText} title="Tròng kính" />
          <div className="grid gap-3 md:grid-cols-2">
            <RowCard label="Loại tròng" value={detail.lensTypeCode || `#${detail.lensTypeId}`} />
            <RowCard label="Giá tròng cơ bản" value={formatCurrency(detail.lensBasePrice)} />
            <RowCard label="Tổng tiền tròng" value={formatCurrency(detail.totalLensPrice)} />
          </div>
        </section>

        {detail.prescriptionImageUrl ? (
          <section>
            <SectionTitle icon={ImageIcon} title="Ảnh toa" />
            <button
              type="button"
              onClick={() => onOpenImagePreview(detail.prescriptionImageUrl)}
              className="inline-flex items-center gap-2 text-primary hover:underline"
            >
              <ImageIcon className="h-4 w-4" />
              Mở ảnh toa
            </button>
          </section>
        ) : null}

        <section>
          <SectionTitle icon={Eye} title="Đơn hàng liên quan" />
          {isRelatedOrderLoading ? (
            <p className="rounded-2xl border border-border bg-secondary/60 px-4 py-3 text-sm text-muted-foreground">
              Đang tải thông tin đơn hàng...
            </p>
          ) : null}

          {!isRelatedOrderLoading && relatedOrderError ? (
            <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {relatedOrderError}
            </p>
          ) : null}

          {!isRelatedOrderLoading && !relatedOrderError && relatedOrder ? (
            <div className="rounded-2xl border border-border bg-secondary/60 p-4">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium">Đơn #{relatedOrder.orderId}</p>
                <StatusBadge
                  status={relatedOrder.orderStatus}
                  label={getOrderStatusLabel(relatedOrder.orderStatus)}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Cập nhật lúc: {relatedOrder.updatedAt ? new Date(relatedOrder.updatedAt).toLocaleString("vi-VN") : "-"}
              </p>
              <Link
                to={`${orderBasePath}/${relatedOrder.orderId}`}
                className="mt-3 inline-flex items-center gap-2 text-sm text-primary hover:underline"
              >
                Mở chi tiết đơn hàng
              </Link>
            </div>
          ) : null}
        </section>

        <section>
          <SectionTitle icon={FileText} title="Ghi chú xử lý" />
          <textarea
            value={actionNote}
            onChange={(event) => setActionNote(event.target.value)}
            rows={4}
            placeholder="Nhập ghi chú để duyệt hoặc từ chối"
            className="w-full rounded-2xl border border-border bg-background px-4 py-3 outline-none focus:border-primary"
          />
          {actionError ? <p className="mt-3 text-sm text-red-600">{actionError}</p> : null}
        </section>

        <section className="flex flex-wrap gap-3 border-t border-border pt-6">
          {status === "submitted" ? (
            <ActionButton disabled={saving} onClick={() => onReview("reviewing")}>
              <Eye className="h-4 w-4" />
              Đang kiểm tra
            </ActionButton>
          ) : null}

          {["submitted", "reviewing"].includes(status) ? (
            <>
              <ActionButton disabled={saving} onClick={() => onReview("approved")} tone="success">
                <Check className="h-4 w-4" />
                Duyệt
              </ActionButton>
              <ActionButton disabled={saving} onClick={() => onReview("rejected")} tone="danger">
                <X className="h-4 w-4" />
                Từ chối
              </ActionButton>
            </>
          ) : null}
        </section>
      </div>

    </div>
  );
}

function ActionButton({ children, onClick, disabled, tone = "default" }) {
  const toneClass =
    tone === "success"
      ? "border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700"
      : tone === "danger"
        ? "border-red-600 bg-red-600 text-white hover:bg-red-700"
        : "border-primary bg-primary text-white hover:bg-primary/90";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-2 rounded-xl border px-4 py-3 text-sm transition-colors disabled:opacity-60 ${toneClass}`}
    >
      {children}
    </button>
  );
}

function SectionTitle({ icon: Icon, title }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <Icon className="h-5 w-5 text-primary" />
      <h3 className="text-lg">{title}</h3>
    </div>
  );
}

function EyeCard({ title, eye }) {
  return (
    <div className="rounded-2xl bg-secondary/60 p-4">
      <p className="mb-3 font-medium">{title}</p>
      <Row label="SPH" value={eye.sph} />
      <Row label="CYL" value={eye.cyl} />
      <Row label="AXIS" value={eye.axis} />
    </div>
  );
}

function RowCard({ label, value }) {
  return (
    <div className="rounded-2xl bg-secondary/60 p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1">{value}</p>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span>{value}</span>
    </div>
  );
}

function StatusBadge({ status, label }) {
  const presentation = getStatusPresentation(status, label);
  return <span className={`rounded-full px-3 py-1 text-sm font-semibold ${presentation.className}`}>{presentation.label}</span>;
}

function LoadingCard({ text }) {
  return (
    <div className="rounded-[28px] border border-border bg-white p-8 text-center shadow-sm">
      <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}

function EmptyCard({ text }) {
  return (
    <div className="rounded-[28px] border border-border bg-white p-10 text-center shadow-sm">
      <Eye className="mx-auto mb-4 h-14 w-14 text-muted-foreground" />
      <p className="text-muted-foreground">{text}</p>
    </div>
  );
}

function getStatusPresentation(status, fallbackLabel) {
  const normalizedStatus = normalizeStatus(status);
  const knownPresentation = STATUS_PRESENTATIONS[normalizedStatus];

  if (knownPresentation) {
    return knownPresentation;
  }

  return {
    label: fallbackLabel || "Đang cập nhật",
    className: "border border-slate-200 bg-slate-100 text-slate-700",
  };
}

function normalizeStatus(status) {
  return String(status ?? "").trim().toLowerCase();
}

function getOrderStatusLabel(status) {
  switch (normalizeStatus(status)) {
    case "pending":
      return "Chờ duyệt";
    case "awaitingstock":
      return "Chờ hàng";
    case "processing":
      return "Đang xử lý";
    case "shipped":
      return "Đang giao";
    case "completed":
      return "Hoàn thành";
    case "cancelled":
      return "Đã hủy";
    default:
      return status || "Đang cập nhật";
  }
}

function formatCurrency(amount) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(Number(amount ?? 0));
}

export { StaffPrescriptionReviewPage as default };

