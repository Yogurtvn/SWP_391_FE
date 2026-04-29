import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useEffect, useMemo } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ChevronRight,
  CreditCard,
  MapPin,
  Package,
  Tag,
  Truck,
  Wallet,
  X,
} from "lucide-react";
import { useCheckout } from "@/hooks/order/useCheckout";
import {
  calculateShippingFee,
  getShippingDistricts,
  getShippingErrorMessage,
  getShippingProvinces,
  getShippingWards,
} from "@/services/shippingService";
import { getAvailablePromotions } from "@/services/catalogService";
import { persistPendingPayOsCart } from "@/store/cart/cartStorage";

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
  const [voucherInput, setVoucherInput] = useState("");
  const [appliedVoucherCode, setAppliedVoucherCode] = useState("");
  const [availableVouchers, setAvailableVouchers] = useState([]);
  const [voucherListStatus, setVoucherListStatus] = useState("idle");
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
  const [voucherMessage, setVoucherMessage] = useState("");
  const [voucherMessageTone, setVoucherMessageTone] = useState("muted");
  const [localError, setLocalError] = useState("");

  const checkoutTitle = getCheckoutTitle(checkoutOrderType);
  const checkoutDescription = getCheckoutDescription(checkoutOrderType, itemCount);
  const isLoadingCart = cartStatus === "loading" && checkoutItems.length === 0 && blockedItems.length === 0;
  const isSubmitting = checkoutStatus === "loading";
  const shippingItems = useMemo(
    () =>
      checkoutItems
        .map((item) => ({
          variantId: Number(item?.variantId ?? 0),
          quantity: Number(item?.quantity ?? 0),
        }))
        .filter(
          (item) =>
            Number.isFinite(item.variantId)
            && item.variantId > 0
            && Number.isFinite(item.quantity)
            && item.quantity > 0,
        ),
    [checkoutItems],
  );
  const shippingFee = Number(shippingQuote?.totalFee ?? 0);
  const selectedVoucher = useMemo(
    () => findVoucherByCodeOrName(availableVouchers, appliedVoucherCode),
    [availableVouchers, appliedVoucherCode],
  );
  const previewVoucherDiscount = useMemo(
    () => calculateVoucherDiscount(subtotal, selectedVoucher?.discountPercent),
    [subtotal, selectedVoucher?.discountPercent],
  );
  const displayTotal = Math.max(0, subtotal + shippingFee - previewVoucherDiscount);
  const isCalculatingShippingFee = shippingStatus.fee === "loading";
  const isUnsupportedShippingRoute = Boolean(shippingError) && shippingStatus.fee === "failed";

  useEffect(() => {
    let isMounted = true;

    async function loadAvailableVouchers() {
      setVoucherListStatus("loading");

      try {
        const vouchers = await getAvailablePromotions(30);

        if (!isMounted) {
          return;
        }

        setAvailableVouchers(vouchers);
        setVoucherListStatus("succeeded");
      } catch {
        if (!isMounted) {
          return;
        }

        setAvailableVouchers([]);
        setVoucherListStatus("failed");
      }
    }

    void loadAvailableVouchers();

    return () => {
      isMounted = false;
    };
  }, []);

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
    if (!shippingInfo.districtId || !shippingInfo.wardCode || shippingItems.length === 0) {
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
          items: shippingItems,
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
  }, [shippingInfo.districtId, shippingInfo.wardCode, shippingItems]);

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

  function handleAutoApplyVoucherFromInput() {
    const normalizedVoucherCode = normalizeVoucherCode(voucherInput);

    if (!normalizedVoucherCode) {
      setAppliedVoucherCode("");
      setVoucherMessageTone("muted");
      setVoucherMessage("");
      return;
    }

    const matchedVoucher = findVoucherByCodeOrName(availableVouchers, normalizedVoucherCode);

    if (matchedVoucher) {
      setAppliedVoucherCode(String(matchedVoucher.promotionId));
      setVoucherInput(matchedVoucher.name);
      setVoucherMessageTone("success");
      setVoucherMessage(`Đã áp dụng tự động ${matchedVoucher.name} (-${matchedVoucher.discountPercent}%).`);
      return;
    }

    setAppliedVoucherCode(normalizedVoucherCode);
    setVoucherInput(normalizedVoucherCode);
    setVoucherMessageTone("muted");
    setVoucherMessage("Đã lưu mã voucher. Hệ thống sẽ xác minh khi bạn xác nhận đơn.");
  }

  function handleSelectVoucher(voucher) {
    if (!voucher) {
      return;
    }

    setAppliedVoucherCode(String(voucher.promotionId));
    setVoucherInput(voucher.name);
    setVoucherMessageTone("success");
    setVoucherMessage(`Đã áp dụng tự động ${voucher.name}. Ước tính giảm ${formatCurrency(calculateVoucherDiscount(subtotal, voucher.discountPercent))}.`);
    setIsVoucherModalOpen(false);
  }

  function handleClearVoucher() {
    setVoucherInput("");
    setAppliedVoucherCode("");
    setVoucherMessageTone("muted");
    setVoucherMessage("Đã bỏ voucher.");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLocalError("");
    const checkoutVoucherCode = appliedVoucherCode || normalizeVoucherCode(voucherInput);

    if (isCalculatingShippingFee) {
      setLocalError("Hệ thống đang tính phí vận chuyển. Vui lòng chờ vài giây rồi thử lại.");
      return;
    }

    if (!shippingQuote) {
      if (shippingError) {
        setLocalError("");
        return;
      }

      setLocalError("Vui lòng chọn đầy đủ tỉnh/thành, quận/huyện, phường/xã để tính phí vận chuyển trước khi đặt hàng.");
      return;
    }

    try {
      if (paymentMethod === "payos") {
        persistPendingPayOsCart(checkoutItems);
      }

      const { result, orderSummary } = await submitCheckout({
        shippingInfo,
        paymentMethod,
        shippingFee,
        voucherCode: checkoutVoucherCode,
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
          orderSummary: createDraftSummary({
            shippingInfo,
            paymentMethod,
            shippingFee,
            voucherCode: checkoutVoucherCode,
          }),
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
                  <div key={item.cartItemId} className="rounded-2xl border border-border/70 bg-white p-3 shadow-sm">
                    <div className="flex gap-3">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-20 w-20 shrink-0 rounded-xl border border-border/60 object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-base font-medium text-foreground">{item.name}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {item.color}
                          {item.size ? ` / ${item.size}` : ""}
                        </p>

                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                            {getCartItemTypeLabel(item)}
                          </span>
                          <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-muted-foreground">
                            SL {item.quantity}
                          </span>
                        </div>

                        {item.orderType === "preOrder" && item.expectedRestockDate ? (
                          <p className="mt-2 text-xs text-orange-700">
                            Dự kiến có hàng: {formatDate(item.expectedRestockDate)}
                          </p>
                        ) : null}
                        {item.orderType === "preOrder" && item.preOrderNote ? (
                          <p className="mt-1 text-xs text-orange-700">{item.preOrderNote}</p>
                        ) : null}

                        <p className="mt-3 text-lg font-semibold text-primary">{formatCurrency(item.totalPrice)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mb-4 rounded-2xl border border-border bg-secondary/40 p-4">
                <p className="mb-3 flex items-center gap-2 text-sm font-medium">
                  <Tag className="h-4 w-4 text-primary" />
                  Mã voucher
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={voucherInput}
                    onChange={(event) => {
                      setVoucherInput(event.target.value);
                      setAppliedVoucherCode("");
                      setVoucherMessage("");
                      setVoucherMessageTone("muted");
                    }}
                    onBlur={handleAutoApplyVoucherFromInput}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        handleAutoApplyVoucherFromInput();
                      }
                    }}
                    placeholder="Nhập tên chương trình hoặc ID voucher"
                    className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary"
                  />
                  {appliedVoucherCode ? (
                    <button
                      type="button"
                      onClick={handleClearVoucher}
                      className="rounded-xl border border-border px-3 py-2 text-sm transition-colors hover:bg-secondary"
                    >
                      Bỏ
                    </button>
                  ) : null}
                </div>
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => setIsVoucherModalOpen(true)}
                    className="flex w-full items-center justify-between rounded-xl border border-primary/20 bg-gradient-to-r from-primary/10 via-white to-white px-3 py-2 text-left transition-colors hover:border-primary/40"
                  >
                    <span className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">Voucher hiện có</span>
                    <span className="flex items-center gap-1 text-xs text-foreground">
                      {voucherListStatus === "loading"
                        ? "Đang tải..."
                        : `${availableVouchers.length} voucher`}
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </span>
                  </button>
                </div>
                {voucherMessage ? (
                  <p
                    className={`mt-2 text-xs ${
                      voucherMessageTone === "success"
                        ? "text-emerald-700"
                        : voucherMessageTone === "error"
                          ? "text-red-600"
                          : "text-muted-foreground"
                    }`}
                  >
                    {voucherMessage}
                  </p>
                ) : null}
              </div>

              <div className="space-y-3 border-t border-border pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tạm tính</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Voucher</span>
                  <span className={selectedVoucher ? "font-medium text-emerald-700" : "text-muted-foreground"}>
                    {selectedVoucher ? `${selectedVoucher.name} (-${selectedVoucher.discountPercent}%)` : (appliedVoucherCode || "Chưa áp dụng")}
                  </span>
                </div>
                {previewVoucherDiscount > 0 ? (
                  <div className="flex justify-between text-sm text-emerald-700">
                    <span>Giảm từ voucher</span>
                    <span>-{formatCurrency(previewVoucherDiscount)}</span>
                  </div>
                ) : null}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Vận chuyển</span>
                  <span className={shippingQuote ? "font-medium" : "text-muted-foreground"}>
                    {shippingStatus.fee === "loading"
                      ? "Đang tính..."
                      : shippingQuote
                        ? formatCurrency(shippingFee)
                        : isUnsupportedShippingRoute
                          ? "Không hỗ trợ giao hàng"
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

            </div>
          </aside>
        </form>
        {isVoucherModalOpen ? (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 py-8"
            onClick={() => setIsVoucherModalOpen(false)}
          >
            <div
              className="w-full max-w-2xl overflow-hidden rounded-[28px] border border-primary/20 bg-white shadow-[0_30px_80px_rgba(15,23,42,0.35)]"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="border-b border-primary/15 bg-gradient-to-r from-primary/10 via-white to-white px-5 py-4">
                <div className="flex items-center justify-between gap-4">
                <div>
                    <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white px-3 py-1 text-xs font-medium text-primary">
                      <Tag className="h-3.5 w-3.5" />
                      Ưu đãi thanh toán
                    </div>
                    <h3 className="text-[1.35rem] leading-tight">Chọn voucher cho đơn hàng</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Áp dụng ngay để xem tổng tiền sau giảm.
                    </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsVoucherModalOpen(false)}
                  className="rounded-full border border-border bg-white p-2 text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                  aria-label="Đóng danh sách voucher"
                >
                  <X className="h-5 w-5" />
                </button>
                </div>
              </div>
              <div className="max-h-[62vh] overflow-y-auto p-5">
                {voucherListStatus === "loading" ? (
                  <div className="rounded-2xl border border-border bg-secondary/40 p-4 text-sm text-muted-foreground">
                    Đang tải danh sách voucher...
                  </div>
                ) : voucherListStatus === "failed" ? (
                  <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    Không tải được danh sách voucher. Vui lòng thử lại sau.
                  </p>
                ) : availableVouchers.length === 0 ? (
                  <p className="rounded-xl border border-border bg-secondary/40 p-3 text-sm text-muted-foreground">
                    Hiện chưa có voucher khả dụng.
                  </p>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {availableVouchers.map((voucher) => {
                      const isSelected = Number(selectedVoucher?.promotionId) === Number(voucher.promotionId);
                      const estimatedDiscount = calculateVoucherDiscount(subtotal, voucher.discountPercent);

                      return (
                        <button
                          key={voucher.promotionId}
                          type="button"
                          onClick={() => handleSelectVoucher(voucher)}
                          className={`w-full rounded-2xl border p-4 text-left transition-all ${
                            isSelected
                              ? "border-primary bg-primary/10 shadow-[0_8px_24px_rgba(217,119,6,0.2)]"
                              : "border-border bg-white hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[0_10px_24px_rgba(15,23,42,0.12)]"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="line-clamp-1 font-semibold text-foreground">
                                {voucher.name || `Voucher #${voucher.promotionId}`}
                              </p>
                              <p className="mt-1 text-sm text-muted-foreground">
                                Giảm {voucher.discountPercent}% · Hết hạn {formatDate(voucher.endAt)}
                              </p>
                              <p className="mt-2 inline-flex rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
                                Ước tính giảm {formatCurrency(estimatedDiscount)}
                              </p>
                              {voucher.description ? (
                                <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{voucher.description}</p>
                              ) : null}
                            </div>
                            {isSelected ? (
                              <span className="shrink-0 rounded-full bg-primary px-2.5 py-1 text-xs font-medium text-white">
                                Đã chọn
                              </span>
                            ) : (
                              <span className="shrink-0 rounded-full border border-primary/20 bg-white px-2.5 py-1 text-xs text-muted-foreground">
                                Chọn
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              <div className="border-t border-border bg-secondary/30 px-5 py-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs text-muted-foreground">
                    {selectedVoucher
                      ? `Đang áp dụng: ${selectedVoucher.name}`
                      : "Chưa chọn voucher"}
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsVoucherModalOpen(false)}
                    className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90"
                  >
                    Xong
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}
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

function formatDate(value) {
  if (!value) {
    return "Chưa cập nhật";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Chưa cập nhật";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
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

function normalizeVoucherCode(value) {
  const normalized = String(value ?? "").trim();
  return normalized.length > 0 ? normalized : "";
}

function findVoucherByCodeOrName(vouchers, rawCode) {
  const normalizedCode = normalizeVoucherCode(rawCode);

  if (!normalizedCode || !Array.isArray(vouchers) || vouchers.length === 0) {
    return null;
  }

  const matchedById = vouchers.find(
    (voucher) => String(voucher?.promotionId ?? "") === normalizedCode,
  );

  if (matchedById) {
    return matchedById;
  }

  return vouchers.find(
    (voucher) =>
      String(voucher?.name ?? "").trim().toLowerCase() === normalizedCode.toLowerCase(),
  ) ?? null;
}

function calculateVoucherDiscount(subtotal, discountPercent) {
  const normalizedSubtotal = Number(subtotal ?? 0);
  const normalizedDiscountPercent = Number(discountPercent ?? 0);

  if (!Number.isFinite(normalizedSubtotal) || normalizedSubtotal <= 0 || !Number.isFinite(normalizedDiscountPercent) || normalizedDiscountPercent <= 0) {
    return 0;
  }

  const rawDiscount = normalizedSubtotal * normalizedDiscountPercent / 100;
  return Math.max(0, Math.round(rawDiscount * 100) / 100);
}




