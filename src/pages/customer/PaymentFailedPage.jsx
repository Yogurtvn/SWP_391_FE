import { Link, useLocation } from "react-router";
import {
  AlertTriangle,
  ArrowLeft,
  CreditCard,
  RefreshCcw,
  ShieldAlert,
  ShoppingBag,
} from "lucide-react";

export default function PaymentFailedPage() {
  const location = useLocation();
  const orderSummary = location.state?.orderSummary ?? createFallbackOrderSummary();
  const errorMessage =
    location.state?.errorMessage ??
    "He thong chua the hoan tat buoc thanh toan. Ban co the thu lai ngay khi san sang.";
  const orderCreated = Boolean(location.state?.orderCreated ?? orderSummary.orderCreated);
  const canTrackOrder = Number(orderSummary.orderId ?? 0) > 0;

  return (
    <div className="min-h-screen bg-secondary/30 py-12">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-[28px] border border-border bg-white shadow-sm">
          <div className="border-b border-border bg-[linear-gradient(135deg,#fff7f5_0%,#fff_55%,#fff9ef_100%)] px-8 py-12 text-center">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-orange-100 text-orange-600">
              <AlertTriangle className="h-10 w-10" />
            </div>
            <p className="mb-3 text-sm uppercase tracking-[0.24em] text-orange-700">
              Thanh toan chua hoan tat
            </p>
            <h1 className="mb-3 text-3xl">
              {orderCreated ? "Don hang da tao nhung chua thanh toan xong" : "Tao don hang that bai"}
            </h1>
            <p className="mx-auto max-w-2xl text-muted-foreground leading-7">{errorMessage}</p>
          </div>

          <div className="grid gap-0 lg:grid-cols-[1.45fr_1fr]">
            <div className="border-b border-border p-8 lg:border-b-0 lg:border-r">
              <div className="mb-8 grid gap-4 sm:grid-cols-2">
                <InfoCard
                  icon={CreditCard}
                  label="Phuong thuc da chon"
                  value={orderSummary.paymentMethodLabel}
                />
                <InfoCard
                  icon={ShoppingBag}
                  label="Gia tri don hang"
                  value={formatCurrency(orderSummary.total)}
                />
                <InfoCard
                  icon={ShieldAlert}
                  label="Trang thai don"
                  value={orderCreated ? `Da tao don #${orderSummary.orderId}` : "Chua tao duoc don"}
                />
                <InfoCard
                  icon={RefreshCcw}
                  label="Buoc nen lam"
                  value={orderCreated ? "Mo lai thanh toan hoac lien he shop" : "Kiem tra gio hang va thu lai"}
                />
              </div>

              <div className="mb-6 rounded-2xl border border-border p-6">
                <h2 className="mb-4 text-lg">Luu y hien tai</h2>
                <div className="space-y-3 text-sm text-muted-foreground">
                  <p>{orderCreated ? "Don hang cua ban van ton tai trong he thong." : "Gio hang van giu nguyen de ban thu lai."}</p>
                  <p>Thong bao chi tiet: {errorMessage}</p>
                  <p>Neu can, ban co the quay lai checkout de nhap lai thong tin hoac chon phuong thuc khac.</p>
                </div>
              </div>

              <div className="rounded-2xl bg-secondary/60 p-6">
                <h2 className="mb-4 text-lg">Thong tin tam thoi</h2>
                <div className="space-y-2 text-sm text-foreground/90">
                  <p>Khach hang: {orderSummary.customerName}</p>
                  <p>So dien thoai: {orderSummary.phone}</p>
                  <p>Dia chi: {orderSummary.shippingAddress}</p>
                  <p>Tong gia tri: {formatCurrency(orderSummary.total)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-8">
              <div className="mb-6 rounded-2xl bg-secondary/60 p-6">
                <p className="mb-2 text-sm text-muted-foreground">Ban co the lam gi tiep theo?</p>
                <div className="space-y-3 text-sm text-foreground/90">
                  <p>Kiem tra lai thong tin giao hang va phuong thuc thanh toan.</p>
                  <p>Quay lai checkout de thu lai.</p>
                  <p>Hoac mo gio hang de dieu chinh san pham.</p>
                </div>
              </div>

              <div className="space-y-3">
                <Link
                  to="/checkout"
                  className="flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-white transition-colors hover:bg-primary/90"
                >
                  Thu lai thanh toan
                  <RefreshCcw className="h-4 w-4" />
                </Link>
                <Link
                  to="/cart"
                  className="flex items-center justify-center gap-2 rounded-xl border border-border px-5 py-3 transition-colors hover:bg-secondary"
                >
                  Quay ve gio hang
                </Link>
                {orderCreated && canTrackOrder ? (
                  <Link
                    to={`/orders/${orderSummary.orderId}`}
                    className="flex items-center justify-center gap-2 rounded-xl border border-border px-5 py-3 transition-colors hover:bg-secondary"
                  >
                    Xem don hang da tao
                  </Link>
                ) : null}
                <Link
                  to="/shop"
                  className="flex items-center justify-center gap-2 rounded-xl border border-border px-5 py-3 transition-colors hover:bg-secondary"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Tiep tuc mua sam
                </Link>
              </div>
            </div>
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
    paymentMethodLabel: "Thanh toan online",
    total: 0,
    customerName: "Khach hang Vision Direct",
    phone: "Chua cap nhat",
    shippingAddress: "Dia chi giao hang se duoc cap nhat sau.",
  };
}

function formatCurrency(value) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(Number(value ?? 0));
}
