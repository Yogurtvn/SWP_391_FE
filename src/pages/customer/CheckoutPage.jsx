import { useState } from "react";
import { Link, useNavigate } from "react-router";
import {
  AlertCircle,
  ArrowLeft,
  CreditCard,
  MapPin,
  Package,
  ShieldCheck,
  Truck,
  Wallet,
} from "lucide-react";
import { useCheckout } from "@/hooks/order/useCheckout";

const INITIAL_SHIPPING_INFO = {
  fullName: "",
  email: "",
  phone: "",
  address: "",
  ward: "",
  district: "",
  city: "",
};

export default function CheckoutPage() {
  const navigate = useNavigate();
  const {
    isCustomerSession,
    readyItems,
    blockedItems,
    itemCount,
    subtotal,
    shippingFee,
    total,
    cartStatus,
    checkoutStatus,
    checkoutError,
    submitCheckout,
    createDraftSummary,
  } = useCheckout();

  const [shippingInfo, setShippingInfo] = useState(INITIAL_SHIPPING_INFO);
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [localError, setLocalError] = useState("");

  const isLoadingCart = cartStatus === "loading" && readyItems.length === 0 && blockedItems.length === 0;
  const isSubmitting = checkoutStatus === "loading";

  async function handleSubmit(event) {
    event.preventDefault();
    setLocalError("");

    try {
      const { result, orderSummary } = await submitCheckout({
        shippingInfo,
        paymentMethod,
      });

      if (paymentMethod === "momo") {
        if (result?.payment?.payUrl) {
          window.location.assign(result.payment.payUrl);
          return;
        }

        navigate("/checkout/failure", {
          state: {
            orderSummary,
            orderCreated: true,
            errorMessage:
              "Don hang da duoc tao, nhung he thong chua lay duoc lien ket thanh toan MoMo. Vui long thu lai sau hoac lien he cua hang.",
          },
        });
        return;
      }

      navigate("/checkout/success", {
        state: {
          orderSummary,
        },
      });
    } catch (error) {
      const errorMessage = resolveErrorMessage(
        error,
        checkoutError || "Khong the tao don hang tu gio hang hien tai.",
      );

      setLocalError(errorMessage);

      navigate("/checkout/failure", {
        state: {
          orderSummary: createDraftSummary({ shippingInfo, paymentMethod }),
          orderCreated: false,
          errorMessage,
        },
      });
    }
  }

  if (!isCustomerSession) {
    return (
      <StateCard
        icon={Wallet}
        title="Checkout can tai khoan khach hang"
        description="Vui long dang nhap bang tai khoan customer de tao don hang va dong bo gio hang."
        primaryAction={{
          label: "Dang nhap",
          to: "/login",
        }}
        secondaryAction={{
          label: "Quay lai gio hang",
          to: "/cart",
        }}
      />
    );
  }

  if (isLoadingCart) {
    return (
      <div className="min-h-screen bg-secondary/30 py-12">
        <div className="mx-auto flex max-w-6xl items-center justify-center px-4">
          <div className="rounded-[28px] border border-border bg-white px-8 py-16 text-center shadow-sm">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
            <p className="text-muted-foreground">Dang dong bo gio hang tu he thong...</p>
          </div>
        </div>
      </div>
    );
  }

  if (readyItems.length === 0 && blockedItems.length === 0) {
    return (
      <StateCard
        icon={Package}
        title="Khong co san pham de checkout"
        description="Gio hang cua ban dang trong. Hay them mot vai san pham co san truoc khi thanh toan."
        primaryAction={{
          label: "Kham pha san pham",
          to: "/shop",
        }}
        secondaryAction={{
          label: "Xem gio hang",
          to: "/cart",
        }}
      />
    );
  }

  if (blockedItems.length > 0) {
    return (
      <div className="min-h-screen bg-secondary/30 py-12">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-[28px] border border-border bg-white p-8 shadow-sm">
            <div className="mb-6 flex items-start gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <AlertCircle className="mt-0.5 h-6 w-6 shrink-0 text-amber-600" />
              <div>
                <h1 className="mb-2 text-2xl">Checkout nay chi xu ly don hang co san</h1>
                <p className="text-sm leading-6 text-amber-900">
                  Trong gio hang cua ban dang co san pham dat truoc hoac san pham theo toa.
                  Flow hien tai minh da map API cho don hang co san, nen ban can quay lai gio hang
                  de tach nhom san pham nay ra truoc khi thanh toan.
                </p>
              </div>
            </div>

            <div className="mb-8 rounded-2xl bg-secondary/60 p-6">
              <p className="mb-3 text-sm text-muted-foreground">San pham dang chan checkout:</p>
              <div className="space-y-3">
                {blockedItems.map((item) => (
                  <div
                    key={item.cartItemId}
                    className="flex items-center justify-between gap-4 rounded-xl bg-white px-4 py-3"
                  >
                    <div>
                      <p>{item.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.orderType === "preOrder" ? "Dat truoc" : item.hasPrescription ? "Theo toa" : "Khac"}
                      </p>
                    </div>
                    <span className="text-sm text-muted-foreground">SL {item.quantity}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                to="/cart"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-white transition-colors hover:bg-primary/90"
              >
                <ArrowLeft className="h-4 w-4" />
                Quay lai gio hang
              </Link>
              <Link
                to="/shop"
                className="inline-flex items-center gap-2 rounded-xl border border-border px-5 py-3 transition-colors hover:bg-secondary"
              >
                Tiep tuc mua sam
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/30 py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link to="/cart" className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Quay lai gio hang
          </Link>
          <h1 className="mb-2 text-3xl">Thanh toan don hang co san</h1>
          <p className="text-muted-foreground">
            Hoan tat thong tin giao hang va chon cach thanh toan cho {itemCount} san pham.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-[1.4fr_0.9fr]">
          <div className="space-y-6">
            {(localError || checkoutError) && (
              <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                <p className="text-sm leading-6">{localError || checkoutError}</p>
              </div>
            )}

            <section className="rounded-[28px] border border-border bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl">Thong tin giao hang</h2>
                  <p className="text-sm text-muted-foreground">Nhap nguoi nhan va dia chi giao hang.</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Field
                  label="Ho va ten"
                  required
                  value={shippingInfo.fullName}
                  onChange={(value) => setShippingInfo((current) => ({ ...current, fullName: value }))}
                  placeholder="Nguyen Van A"
                />
                <Field
                  label="So dien thoai"
                  required
                  value={shippingInfo.phone}
                  onChange={(value) => setShippingInfo((current) => ({ ...current, phone: value }))}
                  placeholder="0901 234 567"
                />
                <Field
                  label="Email"
                  type="email"
                  value={shippingInfo.email}
                  onChange={(value) => setShippingInfo((current) => ({ ...current, email: value }))}
                  placeholder="ban@email.com"
                />
                <Field
                  label="Dia chi"
                  required
                  value={shippingInfo.address}
                  onChange={(value) => setShippingInfo((current) => ({ ...current, address: value }))}
                  placeholder="So nha, ten duong"
                />
                <Field
                  label="Phuong / Xa"
                  value={shippingInfo.ward}
                  onChange={(value) => setShippingInfo((current) => ({ ...current, ward: value }))}
                  placeholder="Phuong 1"
                />
                <Field
                  label="Quan / Huyen"
                  value={shippingInfo.district}
                  onChange={(value) => setShippingInfo((current) => ({ ...current, district: value }))}
                  placeholder="Quan 1"
                />
                <div className="md:col-span-2">
                  <Field
                    label="Tinh / Thanh pho"
                    required
                    value={shippingInfo.city}
                    onChange={(value) => setShippingInfo((current) => ({ ...current, city: value }))}
                    placeholder="TP Ho Chi Minh"
                  />
                </div>
              </div>
            </section>

            <section className="rounded-[28px] border border-border bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Wallet className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl">Phuong thuc thanh toan</h2>
                  <p className="text-sm text-muted-foreground">Flow nay da map COD va MoMo theo API hien co.</p>
                </div>
              </div>

              <div className="space-y-3">
                <PaymentOption
                  icon={Truck}
                  title="Thanh toan khi nhan hang"
                  description="Don hang duoc tao ngay. Ban thanh toan luc nhan hang."
                  checked={paymentMethod === "cod"}
                  onSelect={() => setPaymentMethod("cod")}
                />
                <PaymentOption
                  icon={CreditCard}
                  title="Thanh toan bang MoMo"
                  description="Sau khi tao don, he thong se chuyen ban sang cong thanh toan MoMo neu backend tra ve payUrl."
                  checked={paymentMethod === "momo"}
                  onSelect={() => setPaymentMethod("momo")}
                />
              </div>

              {paymentMethod === "momo" && (
                <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm leading-6 text-blue-900">
                  Sau khi bam thanh toan, FE se goi `POST /api/orders/checkout`.
                  Neu BE tra ve `payment.payUrl`, trinh duyet se duoc chuyen sang MoMo.
                </div>
              )}
            </section>
          </div>

          <aside className="lg:sticky lg:top-24 h-fit">
            <div className="rounded-[28px] border border-border bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Package className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl">Tom tat don hang</h2>
                  <p className="text-sm text-muted-foreground">Chi gom cac san pham co san trong gio.</p>
                </div>
              </div>

              <div className="mb-6 space-y-4">
                {readyItems.map((item) => (
                  <div key={item.cartItemId} className="flex gap-3 rounded-2xl bg-secondary/60 p-3">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-20 w-20 rounded-xl object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2">{item.name}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {item.color}
                        {item.size ? ` / ${item.size}` : ""}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">SL {item.quantity}</p>
                      <p className="mt-2 text-sm text-primary">{formatCurrency(item.totalPrice)}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-3 border-t border-border pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tam tinh</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Van chuyen</span>
                  <span className="text-muted-foreground">Shop xac nhan sau</span>
                </div>
                <div className="flex justify-between border-t border-border pt-3">
                  <span className="text-lg">Tong cong</span>
                  <span className="text-2xl text-primary">{formatCurrency(total)}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-4 text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <div className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Dang xu ly don hang...
                  </>
                ) : paymentMethod === "momo" ? (
                  "Tiep tuc voi MoMo"
                ) : (
                  "Xac nhan dat hang"
                )}
              </button>

              <div className="mt-4 flex items-start gap-3 rounded-2xl bg-secondary/60 p-4 text-sm text-muted-foreground">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
                <p>
                  Backend hien tai chua tinh phi giao hang trong order total.
                  Flow nay dang dung checkout API that cua backend, nen tong tien tren trang nay se khop voi don hang tao ra.
                </p>
              </div>
            </div>
          </aside>
        </form>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, required = false, type = "text" }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm text-foreground">
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
      </span>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-border bg-background px-4 py-3 outline-none transition-colors focus:border-primary"
      />
    </label>
  );
}

function PaymentOption({ icon: Icon, title, description, checked, onSelect }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex w-full items-start gap-4 rounded-2xl border p-4 text-left transition-colors ${
        checked ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
      }`}
    >
      <div className={`flex h-11 w-11 items-center justify-center rounded-full ${checked ? "bg-primary text-white" : "bg-secondary text-foreground"}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1">
        <p>{title}</p>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
      <div className={`mt-1 h-5 w-5 rounded-full border-2 ${checked ? "border-primary bg-primary" : "border-border"}`} />
    </button>
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

function formatCurrency(value) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(Number(value ?? 0));
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
