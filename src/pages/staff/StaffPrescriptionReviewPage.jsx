import { Check, Eye, FileText, Image as ImageIcon, RefreshCw, Search, X } from "lucide-react";
import { useStaffPrescriptionReview } from "@/hooks/prescription/useStaffPrescriptionReview";

const STATUS_FILTERS = [
  { value: "", label: "Tat ca" },
  { value: "submitted", label: "Cho kiem tra" },
  { value: "reviewing", label: "Dang kiem tra" },
  { value: "needMoreInfo", label: "Can bo sung" },
  { value: "approved", label: "Da duyet" },
  { value: "rejected", label: "Tu choi" },
  { value: "inProduction", label: "Dang san xuat" },
];

function StaffPrescriptionReviewPage() {
  const {
    items,
    selectedId,
    detail,
    searchQuery,
    filterStatus,
    actionNote,
    pendingCount,
    ui,
    actions,
  } = useStaffPrescriptionReview();

  return (
    <div className="min-h-screen bg-secondary/30">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 rounded-[28px] border border-border bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Eye className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-3xl">Kiem tra prescription</h1>
                <p className="text-sm text-muted-foreground">{pendingCount} toa dang can xu ly</p>
              </div>
            </div>
            <button
              type="button"
              onClick={actions.loadList}
              disabled={ui.isListLoading}
              className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-3 text-sm hover:bg-secondary disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${ui.isListLoading ? "animate-spin" : ""}`} />
              Tai lai
            </button>
          </div>
        </div>

        <div className="mb-6 rounded-[28px] border border-border bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Tim theo order, prescription, khach hang"
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
              <LoadingCard text="Dang tai danh sach..." />
            ) : items.length === 0 ? (
              <EmptyCard text="Khong co prescription phu hop." />
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
                      <p className="font-medium">Prescription #{item.prescriptionId}</p>
                      <p className="text-sm text-muted-foreground">Order #{item.orderId || "N/A"}</p>
                    </div>
                    <StatusBadge status={item.prescriptionStatus} label={item.prescriptionStatusLabel} />
                  </div>
                  <p className="text-sm">{item.customerName}</p>
                  <p className="text-xs text-muted-foreground">{item.customerEmail}</p>
                  <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{item.lensTypeCode || `Lens #${item.lensTypeId}`}</span>
                    {item.prescriptionImageUrl ? (
                      <span className="inline-flex items-center gap-1 text-primary">
                        <ImageIcon className="h-3.5 w-3.5" />
                        Co anh
                      </span>
                    ) : null}
                  </div>
                </button>
              ))
            )}
          </div>

          <div>
            {ui.isDetailLoading ? (
              <LoadingCard text="Dang tai chi tiet..." />
            ) : detail ? (
              <DetailPanel
                detail={detail}
                actionNote={actionNote}
                setActionNote={actions.setActionNote}
                actionError={ui.actionError}
                saving={ui.isSaving}
                onReview={actions.review}
                onRequestMoreInfo={actions.requestMoreInfo}
              />
            ) : (
              <EmptyCard text="Chon mot prescription de kiem tra." />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailPanel({ detail, actionNote, setActionNote, actionError, saving, onReview, onRequestMoreInfo }) {
  const status = normalizeStatus(detail.prescriptionStatus);

  return (
    <div className="overflow-hidden rounded-[28px] border border-border bg-white shadow-sm">
      <div className="border-b border-border bg-secondary/50 p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-2xl">Prescription #{detail.prescriptionId}</h2>
            <p className="mt-1 text-sm text-muted-foreground">Order #{detail.orderId || "N/A"}</p>
            <p className="mt-3">{detail.customerName}</p>
            <p className="text-sm text-muted-foreground">{detail.customerEmail}</p>
          </div>
          <StatusBadge status={detail.prescriptionStatus} label={detail.prescriptionStatusLabel} />
        </div>
      </div>

      <div className="space-y-6 p-6">
        <section>
          <SectionTitle icon={FileText} title="Thong so toa" />
          <div className="grid gap-4 md:grid-cols-2">
            <EyeCard title="Mat phai" eye={detail.rightEye} />
            <EyeCard title="Mat trai" eye={detail.leftEye} />
          </div>
          <div className="mt-4 rounded-2xl bg-secondary/60 p-4">
            <Row label="PD" value={`${detail.pd} mm`} />
          </div>
        </section>

        <section>
          <SectionTitle icon={FileText} title="Trong kinh" />
          <div className="grid gap-3 md:grid-cols-2">
            <RowCard label="Lens" value={detail.lensTypeCode || `#${detail.lensTypeId}`} />
            <RowCard label="Chat lieu" value={detail.lensMaterial || "Mac dinh"} />
            <RowCard label="Lens base" value={formatCurrency(detail.lensBasePrice)} />
            <RowCard label="Material" value={formatCurrency(detail.materialPrice)} />
            <RowCard label="Coating" value={formatCurrency(detail.coatingPrice)} />
            <RowCard label="Tong lens" value={formatCurrency(detail.totalLensPrice)} />
          </div>
          {detail.coatings.length > 0 ? <p className="mt-3 text-sm text-muted-foreground">Coating: {detail.coatings.join(", ")}</p> : null}
        </section>

        {detail.prescriptionImageUrl ? (
          <section>
            <SectionTitle icon={ImageIcon} title="Anh toa" />
            <a href={detail.prescriptionImageUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-primary hover:underline">
              <ImageIcon className="h-4 w-4" />
              Mo anh toa
            </a>
          </section>
        ) : null}

        <section>
          <SectionTitle icon={FileText} title="Ghi chu xu ly" />
          <textarea
            value={actionNote}
            onChange={(event) => setActionNote(event.target.value)}
            rows={4}
            placeholder="Nhap ghi chu cho review hoac yeu cau bo sung"
            className="w-full rounded-2xl border border-border bg-background px-4 py-3 outline-none focus:border-primary"
          />
          {actionError ? <p className="mt-3 text-sm text-red-600">{actionError}</p> : null}
        </section>

        <section className="flex flex-wrap gap-3 border-t border-border pt-6">
          {["submitted", "needmoreinfo"].includes(status) ? (
            <ActionButton disabled={saving} onClick={() => onReview("reviewing")}>
              <Eye className="h-4 w-4" />
              Dang kiem tra
            </ActionButton>
          ) : null}

          {["submitted", "reviewing"].includes(status) ? (
            <>
              <ActionButton disabled={saving} onClick={() => onReview("approved")} tone="success">
                <Check className="h-4 w-4" />
                Duyet
              </ActionButton>
              <ActionButton disabled={saving} onClick={onRequestMoreInfo} tone="warning">
                <RefreshCw className="h-4 w-4" />
                Can bo sung
              </ActionButton>
              <ActionButton disabled={saving} onClick={() => onReview("rejected")} tone="danger">
                <X className="h-4 w-4" />
                Tu choi
              </ActionButton>
            </>
          ) : null}

          {status === "approved" ? (
            <ActionButton disabled={saving} onClick={() => onReview("inProduction")} tone="success">
              <Check className="h-4 w-4" />
              San xuat
            </ActionButton>
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
        : tone === "warning"
          ? "border-amber-500 bg-amber-500 text-white hover:bg-amber-600"
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
  return <span className={`rounded-full px-3 py-1 text-sm ${getStatusColor(status)}`}>{label}</span>;
}

function LoadingCard({ text }) {
  return (
    <div className="rounded-[28px] border border-border bg-white p-8 text-center shadow-sm">
      <div className="mx-auto mb-4 h-10 w-10 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
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

function getStatusColor(status) {
  switch (normalizeStatus(status)) {
    case "approved":
    case "inproduction":
      return "bg-emerald-100 text-emerald-700";
    case "needmoreinfo":
      return "bg-amber-100 text-amber-700";
    case "rejected":
      return "bg-red-100 text-red-700";
    case "reviewing":
      return "bg-blue-100 text-blue-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

function normalizeStatus(status) {
  return String(status ?? "").trim().toLowerCase();
}

function formatCurrency(amount) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(Number(amount ?? 0));
}

export { StaffPrescriptionReviewPage as default };
