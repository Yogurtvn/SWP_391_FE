import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useEffect, useMemo } from "react";
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
import {
  calculateShippingFee,
  getShippingDistricts,
  getShippingErrorMessage,
  getShippingProvinces,
  getShippingWards,
} from "@/services/shippingService";

const INITIAL_SHIPPING_INFO = {
  fullName: "",
  email: "",
  phone: "",
  address: "",
  ward: "",
  wardCode: "",
  district: "",
  districtId: "",
  city: "",
  provinceId: "",
};

export default function CheckoutPage() {
  const navigate = useNavigate();
  const {
    isCustomerSession,
    checkoutItems,
    blockedItems,
    checkoutOrderType,
    itemCount,
    subtotal,
    cartStatus,
    checkoutStatus,
    checkoutError,
    submitCheckout,
    createDraftSummary,
  } = useCheckout();

  const [shippingInfo, setShippingInfo] = useState(INITIAL_SHIPPING_INFO);
  const [shippingOptions, setShippingOptions] = useState({
    provinces: [],
    districts: [],
    wards: [],
  });
  const [shippingStatus, setShippingStatus] = useState({
    provinces: "idle",
    districts: "idle",
    wards: "idle",
    fee: "idle",
  });
  const [shippingQuote, setShippingQuote] = useState(null);
  const [shippingError, setShippingError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [localError, setLocalError] = useState("");

  const checkoutTitle = getCheckoutTitle(checkoutOrderType);
  const checkoutDescription = getCheckoutDescription(checkoutOrderType, itemCount);
  const isLoadingCart = cartStatus === "loading" && checkoutItems.length === 0 && blockedItems.length === 0;
  const isSubmitting = checkoutStatus === "loading";
  const shippingWeight = useMemo(() => Math.max(200, itemCount * 200), [itemCount]);
  const shippingFee = Number(shippingQuote?.totalFee ?? 0);
  const displayTotal = subtotal + shippingFee;
  const isCalculatingShippingFee = shippingStatus.fee === "loading";

  useEffect(() => {
    let isMounted = true;

    async function loadProvinces() {
      setShippingStatus((current) => ({ ...current, provinces: "loading" }));
      setShippingError("");

      try {
        const provinces = await getShippingProvinces();

        if (!isMounted) {
          return;
        }

        setShippingOptions((current) => ({ ...current, provinces }));
        setShippingStatus((current) => ({ ...current, provinces: "succeeded" }));
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setShippingStatus((current) => ({ ...current, provinces: "failed" }));
        setShippingError(getShippingErrorMessage(error, "Không thể tải danh sách tỉnh/thành."));
      }
    }

    void loadProvinces();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!shippingInfo.provinceId) {
      setShippingOptions((current) => ({ ...current, districts: [], wards: [] }));
      return;
    }

    let isMounted = true;

    async function loadDistricts() {
      setShippingStatus((current) => ({ ...current, districts: "loading" }));
      setShippingError("");

      try {
        const districts = await getShippingDistricts(shippingInfo.provinceId);

        if (!isMounted) {
          return;
        }

        setShippingOptions((current) => ({ ...current, districts, wards: [] }));
        setShippingStatus((current) => ({ ...current, districts: "succeeded" }));
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setShippingStatus((current) => ({ ...current, districts: "failed" }));
        setShippingError(getShippingErrorMessage(error, "Không thể tải danh sách quận/huyện."));
      }
    }

    void loadDistricts();

    return () => {
      isMounted = false;
    };
  }, [shippingInfo.provinceId]);

  useEffect(() => {
    if (!shippingInfo.districtId) {
      setShippingOptions((current) => ({ ...current, wards: [] }));
      setShippingQuote(null);
      return;
    }

    let isMounted = true;

    async function loadWards() {
      setShippingStatus((current) => ({ ...current, wards: "loading" }));
      setShippingError("");

      try {
        const wards = await getShippingWards(shippingInfo.districtId);

        if (!isMounted) {
          return;
        }

        setShippingOptions((current) => ({ ...current, wards }));
        setShippingStatus((current) => ({ ...current, wards: "succeeded" }));
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setShippingStatus((current) => ({ ...current, wards: "failed" }));
        setShippingError(getShippingErrorMessage(error, "Không thể tải danh sách phường/xã."));
      }
    }

    void loadWards();

    return () => {
      isMounted = false;
    };
  }, [shippingInfo.districtId]);

  useEffect(() => {
    if (!shippingInfo.districtId || !shippingInfo.wardCode) {
      setShippingQuote(null);
      return;
    }

    let isMounted = true;

    async function loadShippingFee() {
      setShippingStatus((current) => ({ ...current, fee: "loading" }));
      setShippingError("");

      try {
        const quote = await calculateShippingFee({
          districtId: shippingInfo.districtId,
          wardCode: shippingInfo.wardCode,
          weight: shippingWeight,
        });

        if (!isMounted) {
          return;
        }

        setShippingQuote(quote);
        setShippingStatus((current) => ({ ...current, fee: "succeeded" }));
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setShippingQuote(null);
        setShippingStatus((current) => ({ ...current, fee: "failed" }));
        setShippingError(getShippingErrorMessage(error, "Không thể tính phí vận chuyển."));
      }
    }

    void loadShippingFee();

    return () => {
      isMounted = false;
    };
  }, [shippingInfo.districtId, shippingInfo.wardCode, shippingWeight]);

  function updateShippingInfo(patch) {
    setShippingInfo((current) => ({
      ...current,
      ...patch,
    }));
  }

  function handleProvinceChange(provinceId) {
    const province = shippingOptions.provinces.find((item) => String(item.provinceId) === String(provinceId));

    updateShippingInfo({
      provinceId,
      city: province?.provinceName ?? "",
      districtId: "",
      district: "",
      wardCode: "",
      ward: "",
    });
  }

  function handleDistrictChange(districtId) {
    const district = shippingOptions.districts.find((item) => String(item.districtId) === String(districtId));

    updateShippingInfo({
      districtId,
      district: district?.districtName ?? "",
      wardCode: "",
      ward: "",
    });
  }

  function handleWardChange(wardCode) {
    const ward = shippingOptions.wards.find((item) => String(item.wardCode) === String(wardCode));

    updateShippingInfo({
      wardCode,
      ward: ward?.wardName ?? "",
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLocalError("");

    if (isCalculatingShippingFee) {
      setLocalError("Hệ thống đang tính phí vận chuyển. Vui lòng chờ vài giây rồi thử lại.");
      return;
    }

    if (!shippingQuote) {
      setLocalError("Vui lòng chọn đầy đủ tỉnh/thành, quận/huyện, phường/xã để tính phí vận chuyển trước khi đặt hàng.");
      return;
    }

    try {
      const { result, orderSummary } = await submitCheckout({
        shippingInfo,
        paymentMethod,
        shippingFee,
      });

      if (paymentMethod === "payos") {
        if (result?.payment?.payUrl) {
          window.location.assign(result.payment.payUrl);
          return;
        }

        navigate("/checkout/failure", {
          state: {
            orderSummary,
            orderCreated: true,
            errorMessage:
              "Đơn hàng đã được tạo, nhưng hệ thống chưa lấy được liên kết thanh toán PayOS. Vui lòng thử lại sau hoặc liên hệ cửa hàng.",
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
        checkoutError || "Không thể tạo đơn hàng từ giỏ hàng hiện tại.",
      );

      setLocalError(errorMessage);

      navigate("/checkout/failure", {
        state: {
          orderSummary: createDraftSummary({ shippingInfo, paymentMethod, shippingFee }),
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
        title="Checkout cần tài khoản khách hàng"
        description="Vui lòng đăng nhập bằng tài khoản khách hàng để tạo đơn hàng và đồng bộ giỏ hàng."
        primaryAction={{
          label: "Đăng nhập",
          to: "/login",
        }}
        secondaryAction={{
          label: "Quay lại giỏ hàng",
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
            <p className="text-muted-foreground">Đang đồng bộ giỏ hàng từ hệ thống...</p>
          </div>
        </div>
      </div>
    );
  }

  if (checkoutItems.length === 0 && blockedItems.length === 0) {
    return (
      <StateCard
        icon={Package}
        title="Không có sản phẩm để checkout"
        description="Giỏ hàng của bạn đang trống. Hãy thêm sản phẩm vào giỏ trước khi thanh toán."
        primaryAction={{
          label: "Khám phá sản phẩm",
          to: "/shop",
        }}
        secondaryAction={{
          label: "Xem giỏ hàng",
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
                <h1 className="mb-2 text-2xl">Checkout hiện chỉ xử lý giỏ hàng cùng một loại đơn</h1>
                <p className="text-sm leading-6 text-amber-900">
                  Backend checkout yêu cầu tất cả cart item trong cùng một lần thanh toán phải có chung `orderType`.
                  Bạn hãy tách riêng đơn có sẵn, đơn đặt trước, hoặc đơn theo toa trước khi checkout.
                </p>
              </div>
            </div>

            <div className="mb-8 rounded-2xl bg-secondary/60 p-6">
              <p className="mb-3 text-sm text-muted-foreground">Sản phẩm đang chặn checkout:</p>
              <div className="space-y-3">
                {blockedItems.map((item) => (
                  <div
                    key={item.cartItemId}
                    className="flex items-center justify-between gap-4 rounded-xl bg-white px-4 py-3"
                  >
                    <div>
                      <p>{item.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.orderType === "preOrder" ? "Đặt trước" : item.hasPrescription ? "Theo toa" : "Khác"}
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
                Quay lại giỏ hàng
              </Link>
              <Link
                to="/shop"
                className="inline-flex items-center gap-2 rounded-xl border border-border px-5 py-3 transition-colors hover:bg-secondary"
              >
                Tiếp tục mua sắm
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
            Quay lại giỏ hàng
          </Link>
          <h1 className="mb-2 text-3xl">{checkoutTitle}</h1>
          <p className="text-muted-foreground">{checkoutDescription}</p>
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
                  <h2 className="text-xl">Thông tin giao hàng</h2>
                  <p className="text-sm text-muted-foreground">Nhập người nhận và địa chỉ giao hàng.</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Field
                  label="Họ và tên"
                  required
                  value={shippingInfo.fullName}
                  onChange={(value) => updateShippingInfo({ fullName: value })}
                  placeholder="Nguyễn Văn A"
                />
                <Field
                  label="Số điện thoại"
                  required
                  value={shippingInfo.phone}
                  onChange={(value) => updateShippingInfo({ phone: value })}
                  placeholder="0901 234 567"
                />
                <Field
                  label="Email"
                  type="email"
                  value={shippingInfo.email}
                  onChange={(value) => updateShippingInfo({ email: value })}
                  placeholder="ban@email.com"
                />
                <Field
                  label="Địa chỉ"
                  required
                  value={shippingInfo.address}
                  onChange={(value) => updateShippingInfo({ address: value })}
                  placeholder="Số nhà, tên đường"
                />
                <SelectField
                  label="Tỉnh / Thành phố"
                  required
                  value={shippingInfo.provinceId}
                  onChange={handleProvinceChange}
                  disabled={shippingStatus.provinces === "loading"}
                  placeholder={shippingStatus.provinces === "loading" ? "Đang tải tỉnh/thành..." : "Chọn tỉnh/thành"}
                  options={shippingOptions.provinces.map((item) => ({
                    value: item.provinceId,
                    label: item.provinceName,
                  }))}
                />
                <SelectField
                  label="Quận / Huyện"
                  required
                  value={shippingInfo.districtId}
                  onChange={handleDistrictChange}
                  disabled={!shippingInfo.provinceId || shippingStatus.districts === "loading"}
                  placeholder={shippingStatus.districts === "loading" ? "Đang tải quận/huyện..." : "Chọn quận/huyện"}
                  options={shippingOptions.districts.map((item) => ({
                    value: item.districtId,
                    label: item.districtName,
                  }))}
                />
                <SelectField
                  label="Phường / Xã"
                  required
                  value={shippingInfo.wardCode}
                  onChange={handleWardChange}
                  disabled={!shippingInfo.districtId || shippingStatus.wards === "loading"}
                  placeholder={shippingStatus.wards === "loading" ? "Đang tải phường/xã..." : "Chọn phường/xã"}
                  options={shippingOptions.wards.map((item) => ({
                    value: item.wardCode,
                    label: item.wardName,
                  }))}
                />
                <div className="md:col-span-2">
                  {shippingError ? (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                      {shippingError}
                    </div>
                  ) : shippingQuote ? (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                      Phí vận chuyển GHN: <strong>{formatCurrency(shippingFee)}</strong>
                      {shippingQuote.expectedDeliveryTime ? ` · Dự kiến ${shippingQuote.expectedDeliveryTime}` : ""}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-border bg-secondary/60 p-4 text-sm text-muted-foreground">
                      Chọn đủ tỉnh/thành, quận/huyện và phường/xã để hệ thống tính phí vận chuyển.
                    </div>
                  )}
                </div>
              </div>
            </section>

            <section className="rounded-[28px] border border-border bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Wallet className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl">Phương thức thanh toán</h2>
                  <p className="text-sm text-muted-foreground">Flow này đã map COD và PayOS theo API hiện có.</p>
                </div>
              </div>

              <div className="space-y-3">
                <PaymentOption
                  icon={Truck}
                  title="Thanh toán khi nhận hàng"
                  description="Đơn hàng được tạo ngay. Bạn thanh toán lúc nhận hàng."
                  checked={paymentMethod === "cod"}
                  onSelect={() => setPaymentMethod("cod")}
                />
                <PaymentOption
                  icon={CreditCard}
                  title="Thanh toán bằng PayOS"
                  description="Sau khi tạo đơn, hệ thống sẽ chuyển bạn sang cổng thanh toán PayOS nếu backend trả về payUrl."
                  checked={paymentMethod === "payos"}
                  onSelect={() => setPaymentMethod("payos")}
                />
              </div>

              {paymentMethod === "payos" && (
                <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm leading-6 text-blue-900">
                  Sau khi bấm thanh toán, FE sẽ gọi `POST /api/orders/checkout`.
                  Nếu BE trả về `payment.payUrl`, trình duyệt sẽ được chuyển sang PayOS.
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
                  <h2 className="text-xl">Tóm tắt đơn hàng</h2>
                  <p className="text-sm text-muted-foreground">
                    Đang checkout nhóm sản phẩm `{getOrderTypeLabel(checkoutOrderType)}`.
                  </p>
                </div>
              </div>

              <div className="mb-6 space-y-4">
                {checkoutItems.map((item) => (
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
                      <p className="mt-1 text-sm text-muted-foreground">{getCartItemTypeLabel(item)}</p>
                      <p className="mt-1 text-sm text-muted-foreground">SL {item.quantity}</p>
                      <p className="mt-2 text-sm text-primary">{formatCurrency(item.totalPrice)}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-3 border-t border-border pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tạm tính</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Vận chuyển</span>
                  <span className={shippingQuote ? "font-medium" : "text-muted-foreground"}>
                    {shippingStatus.fee === "loading"
                      ? "Đang tính..."
                      : shippingQuote
                        ? formatCurrency(shippingFee)
                        : "Chưa chọn địa chỉ"}
                  </span>
                </div>
                <div className="flex justify-between border-t border-border pt-3">
                  <span className="text-lg">Tổng tạm tính</span>
                  <span className="text-2xl text-primary">{formatCurrency(displayTotal)}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || isCalculatingShippingFee}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-4 text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <div className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Đang xử lý đơn hàng...
                  </>
                ) : isCalculatingShippingFee ? (
                  "Đang tính phí vận chuyển..."
                ) : paymentMethod === "payos" ? (
                  "Tiếp tục với PayOS"
                ) : (
                  "Xác nhận đặt hàng"
                )}
              </button>

              <div className="mt-4 flex items-start gap-3 rounded-2xl bg-secondary/60 p-4 text-sm text-muted-foreground">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
                <p>
                  Phí vận chuyển đang lấy từ API GHN của backend và được gửi kèm checkout để PayOS thu đúng tổng tiền.
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

function SelectField({ label, value, onChange, options, placeholder, required = false, disabled = false }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm text-foreground">
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
      </span>
      <select
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        className="w-full rounded-xl border border-border bg-background px-4 py-3 outline-none transition-colors focus:border-primary disabled:cursor-not-allowed disabled:opacity-60"
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
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

function getCheckoutTitle(orderType) {
  switch (String(orderType ?? "").trim().toLowerCase()) {
    case "prescription":
      return "Thanh toán đơn kính theo toa";
    case "preorder":
      return "Thanh toán đơn đặt trước";
    default:
      return "Thanh toán đơn hàng có sẵn";
  }
}

function getCheckoutDescription(orderType, itemCount) {
  switch (String(orderType ?? "").trim().toLowerCase()) {
    case "prescription":
      return `Hoàn tất thông tin giao hàng và thanh toán cho ${itemCount} sản phẩm theo toa.`;
    case "preorder":
      return `Hoàn tất thông tin giao hàng cho ${itemCount} sản phẩm đặt trước.`;
    default:
      return `Hoàn tất thông tin giao hàng và chọn cách thanh toán cho ${itemCount} sản phẩm.`;
  }
}

function getOrderTypeLabel(orderType) {
  switch (String(orderType ?? "").trim().toLowerCase()) {
    case "prescription":
      return "theo toa";
    case "preorder":
      return "đặt trước";
    default:
      return "có sẵn";
  }
}

function getCartItemTypeLabel(item) {
  if (item?.hasPrescription) {
    return `Theo toa${item?.prescriptionDetails?.lensType ? ` / ${item.prescriptionDetails.lensType}` : ""}`;
  }

  if (String(item?.orderType ?? "").trim().toLowerCase() === "preorder") {
    return "Đặt trước";
  }

  return "Hàng có sẵn";
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




