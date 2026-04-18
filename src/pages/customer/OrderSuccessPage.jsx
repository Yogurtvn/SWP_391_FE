import { Link, useLocation } from "react-router";
import {
  ArrowRight,
  CheckCircle2,
  PackageCheck,
  ShoppingBag,
  Truck,
  Wallet,
} from "lucide-react";

export default function OrderSuccessPage() {
  const location = useLocation();
  const orderSummary = location.state?.orderSummary ?? createFallbackOrderSummary();
  const canTrackOrder = Number(orderSummary.orderId ?? 0) > 0;

  return (
    <div className="min-h-screen bg-secondary/30 py-12">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-[28px] border border-border bg-white shadow-sm">
          <div className="border-b border-border bg-[linear-gradient(135deg,#fff8ec_0%,#fff_55%,#f6fff7_100%)] px-8 py-12 text-center">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-green-600">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <p className="mb-3 text-sm uppercase tracking-[0.24em] text-green-700">Dat hang thanh cong</p>
            <h1 className="mb-3 text-3xl">Don hang da duoc tao</h1>
            <p className="mx-auto max-w-2xl text-muted-foreground leading-7">
              Vision Direct da ghi nhan don hang cua ban.
              Doi ngu se bat dau xu ly ngay sau khi tiep nhan.
            </p>
          </div>

          <div className="grid gap-0 lg:grid-cols-[1.5fr_1fr]">
            <div className="border-b border-border p-8 lg:border-b-0 lg:border-r">
              <div className="mb-8 grid gap-4 sm:grid-cols-2">
                <SummaryCard
                  icon={PackageCheck}
                  label="Ma don hang"
                  value={Number(orderSummary.orderId) > 0 ? `#${orderSummary.orderId}` : "Dang cap nhat"}
                />
                <SummaryCard
                  icon={Wallet}
                  label="Phuong thuc thanh toan"
                  value={orderSummary.paymentMethodLabel}
                />
                <SummaryCard
                  icon={Truck}
                  label="Trang thai don"
                  value={orderSummary.orderStatusLabel}
                />
                <SummaryCard
                  icon={ShoppingBag}
                  label="Tong thanh toan"
                  value={formatCurrency(orderSummary.total)}
                />
              </div>

              <div className="mb-6 rounded-2xl bg-secondary/60 p-6">
                <h2 className="mb-4 text-lg">Thong tin nhan hang</h2>
                <div className="space-y-2 text-sm text-foreground/90">
                  <p>{orderSummary.customerName}</p>
                  <p>{orderSummary.phone}</p>
                  <p>{orderSummary.email}</p>
                  <p>{orderSummary.shippingAddress}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-border p-6">
                <h2 className="mb-4 text-lg">Cap nhat tiep theo</h2>
                <div className="space-y-3 text-sm text-muted-foreground">
                  <p>Trang thai hien tai: {orderSummary.orderStatusLabel}.</p>
                  <p>Thanh toan: {orderSummary.paymentStatusLabel}.</p>
                  <p>Ban co the mo chi tiet don hang de theo doi cac moc xu ly tiep theo.</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-8">
              <div className="mb-6 rounded-2xl bg-secondary/60 p-6">
                <p className="mb-2 text-sm text-muted-foreground">Dat luc</p>
                <p className="mb-4 text-lg">{orderSummary.createdAtLabel}</p>
                <p className="mb-2 text-sm text-muted-foreground">So san pham</p>
                <p className="text-lg">{orderSummary.itemCount} san pham</p>
              </div>

              <div className="space-y-3">
                {canTrackOrder ? (
                  <Link
                    to={`/orders/${orderSummary.orderId}`}
                    className="flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-white transition-colors hover:bg-primary/90"
                  >
                    Theo doi don hang
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                ) : null}
                <Link
                  to="/shop"
                  className="flex items-center justify-center gap-2 rounded-xl border border-border px-5 py-3 transition-colors hover:bg-secondary"
                >
                  Tiep tuc mua sam
                </Link>
                <Link
                  to="/cart"
                  className="flex items-center justify-center gap-2 rounded-xl border border-border px-5 py-3 transition-colors hover:bg-secondary"
                >
                  Ve gio hang
                </Link>
              </div>
            </div>
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
    orderStatusLabel: "Cho xac nhan",
    paymentMethodLabel: "Thanh toan khi nhan hang",
    paymentStatusLabel: "Cho thanh toan",
    itemCount: 0,
    total: 0,
    customerName: "Khach hang Vision Direct",
    phone: "Chua cap nhat",
    email: "Chua cap nhat",
    shippingAddress: "Dia chi giao hang se duoc cap nhat sau.",
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
