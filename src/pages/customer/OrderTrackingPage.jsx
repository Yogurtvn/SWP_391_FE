import { Link } from "react-router";
import {
  AlertCircle,
  ArrowLeft,
  Clock3,
  CreditCard,
  MapPin,
  Package,
  Phone,
  Truck,
} from "lucide-react";
import { useOrderTracking } from "@/hooks/order/useOrderTracking";

export default function OrderTrackingPage() {
  const { order, authRequired, ui, actions } = useOrderTracking();

  if (authRequired) {
    return (
      <StateCard
        icon={Package}
        title="Can dang nhap de xem don hang"
        description="Chi tiet don hang chi hien thi cho tai khoan da dang nhap."
        primaryAction={{
          label: "Dang nhap",
          to: "/login",
        }}
        secondaryAction={{
          label: "Quay lai cua hang",
          to: "/shop",
        }}
      />
    );
  }

  if (ui.isLoading) {
    return (
      <div className="min-h-screen bg-secondary/30 py-12">
        <div className="mx-auto flex max-w-5xl items-center justify-center px-4">
          <div className="rounded-[28px] border border-border bg-white px-8 py-16 text-center shadow-sm">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
            <p className="text-muted-foreground">Dang tai chi tiet don hang...</p>
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
                <h1 className="mb-2 text-2xl">Khong the mo don hang</h1>
                <p className="text-sm leading-6 text-red-700">
                  {ui.error || "Chi tiet don hang hien chua san sang."}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={actions.retry}
                className="rounded-xl bg-primary px-5 py-3 text-white transition-colors hover:bg-primary/90"
              >
                Tai lai
              </button>
              <Link
                to="/shop"
                className="rounded-xl border border-border px-5 py-3 transition-colors hover:bg-secondary"
              >
                Quay lai cua hang
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/30 py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <Link to="/shop" className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Quay lai cua hang
        </Link>

        <div className="mb-8 rounded-[28px] border border-border bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="mb-2 text-sm uppercase tracking-[0.24em] text-muted-foreground">
                {order.orderTypeLabel}
              </p>
              <h1 className="mb-2 text-3xl">Don hang #{order.orderId}</h1>
              <p className="text-muted-foreground">
                Dat luc {order.createdAtLabel}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge tone={getOrderTone(order.orderStatus)}>{order.orderStatusLabel}</Badge>
              <Badge tone={getPaymentTone(order.payment?.paymentStatus)}>{order.payment?.paymentStatusLabel ?? "Chua co thanh toan"}</Badge>
              <Badge tone={getShippingTone(order.shippingStatus)}>{order.shippingStatusLabel}</Badge>
            </div>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.35fr_0.9fr]">
          <div className="space-y-8">
            <section className="rounded-[28px] border border-border bg-white p-8 shadow-sm">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Clock3 className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl">Lich su trang thai</h2>
                  <p className="text-sm text-muted-foreground">Cap nhat tu backend cho don hang nay.</p>
                </div>
              </div>

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
                      <p className="mt-1 text-sm text-muted-foreground">
                        Cap nhat boi: {history.updatedByName}
                      </p>
                      {history.note ? <p className="mt-2 text-sm leading-6 text-foreground/80">{history.note}</p> : null}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[28px] border border-border bg-white p-8 shadow-sm">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Package className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl">San pham trong don</h2>
                  <p className="text-sm text-muted-foreground">{order.itemCount} san pham duoc tao tu checkout.</p>
                </div>
              </div>

              <div className="space-y-4">
                {order.items.map((item) => (
                  <div key={item.orderItemId} className="rounded-2xl bg-secondary/60 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p>{item.productName}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          SKU {item.sku || "Dang cap nhat"} - Mau {item.selectedColor}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">So luong {item.quantity}</p>
                      </div>
                      <p className="text-primary">{formatCurrency(item.lineTotal)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <aside className="space-y-8">
            <section className="rounded-[28px] border border-border bg-white p-8 shadow-sm">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl">Thong tin giao hang</h2>
                  <p className="text-sm text-muted-foreground">Nguoi nhan va dia chi da luu.</p>
                </div>
              </div>

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
                      <p>Ma van don</p>
                      <p className="text-muted-foreground">{order.shippingCode}</p>
                    </div>
                  </div>
                ) : null}
              </div>
            </section>

            <section className="rounded-[28px] border border-border bg-white p-8 shadow-sm">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl">Thanh toan va tong don</h2>
                  <p className="text-sm text-muted-foreground">Thong tin payment hien tai cua order.</p>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <Row label="Tong tien" value={formatCurrency(order.totalAmount)} />
                <Row label="Trang thai don" value={order.orderStatusLabel} />
                <Row label="Trang thai giao" value={order.shippingStatusLabel} />
                <Row label="Cap nhat lan cuoi" value={order.updatedAtLabel} />
                {order.payment ? (
                  <>
                    <Row label="Payment" value={order.payment.paymentMethodLabel} />
                    <Row label="Trang thai payment" value={order.payment.paymentStatusLabel} />
                    <Row label="Thanh toan luc" value={order.payment.paidAtLabel} />
                  </>
                ) : (
                  <Row label="Payment" value="Chua co ban ghi thanh toan" />
                )}
              </div>
            </section>
          </aside>
        </div>
      </div>
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
          <p className="mx-auto mb-8 max-w-2xl text-muted-foreground leading-7">{description}</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              to={primaryAction.to}
              className="rounded-xl bg-primary px-5 py-3 text-white transition-colors hover:bg-primary/90"
            >
              {primaryAction.label}
            </Link>
            <Link
              to={secondaryAction.to}
              className="rounded-xl border border-border px-5 py-3 transition-colors hover:bg-secondary"
            >
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
    updatedByName: "He thong",
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

function formatCurrency(value) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(Number(value ?? 0));
}
