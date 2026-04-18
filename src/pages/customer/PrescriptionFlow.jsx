import { useEffect, useMemo, useState } from "react";
import { AlertCircle, ArrowLeft, Check, Eye, ShoppingCart } from "lucide-react";
import { Link, useLocation, useNavigate, useParams } from "react-router";
import { useCart } from "@/hooks/cart/useCart";
import { getCatalogErrorMessage, getCatalogProductById } from "@/services/catalogService";
import { createCartItemView, resolvePreferredVariant } from "@/services/cartService";
import { getLensTypeErrorMessage, getLensTypes } from "@/services/lensTypeService";
import {
  calculatePrescriptionPricing,
  getPrescriptionApiErrorMessage,
  getPrescriptionEligibility,
} from "@/services/prescriptionService";

const COATING_OPTIONS = [
  "Chống ánh sáng xanh",
  "Chống phản quang",
  "Chống trầy xước",
  "Chống tia UV",
];

const INITIAL_FORM_STATE = {
  rightSph: "",
  rightCyl: "0",
  rightAxis: "0",
  leftSph: "",
  leftCyl: "0",
  leftAxis: "0",
  pd: "",
  lensMaterial: "",
  notes: "",
};

const INITIAL_PRICING_STATE = {
  status: "idle",
  error: "",
  framePrice: 0,
  lensPrice: 0,
  coatingPrice: 0,
  totalPrice: 0,
};

export default function PrescriptionFlow() {
  const { productId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { addPrescriptionItem, isCustomerSession } = useCart();

  const [product, setProduct] = useState(null);
  const [lensTypes, setLensTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedLensTypeId, setSelectedLensTypeId] = useState("");
  const [selectedCoatings, setSelectedCoatings] = useState([]);
  const [formState, setFormState] = useState(INITIAL_FORM_STATE);
  const [formError, setFormError] = useState("");
  const [pricing, setPricing] = useState(INITIAL_PRICING_STATE);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setLoading(true);
      setError("");

      try {
        const numericProductId = Number.parseInt(String(productId ?? ""), 10);

        if (!Number.isFinite(numericProductId) || numericProductId <= 0) {
          throw new Error("Không tìm thấy sản phẩm hợp lệ cho flow theo toa.");
        }

        const [productDetail, availableLensTypes, eligibility] = await Promise.all([
          getCatalogProductById(numericProductId),
          getLensTypes(),
          getPrescriptionEligibility(numericProductId),
        ]);

        if (!isMounted) {
          return;
        }

        if (!eligibility?.isEligible || !productDetail?.prescriptionCompatible) {
          throw new Error(eligibility?.reason || "Sản phẩm này hiện không hỗ trợ đặt kính theo toa.");
        }

        const preferredVariant = resolvePreferredVariant(productDetail);
        const nextColor = normalizeText(location.state?.selectedColor) ?? productDetail.colors?.[0] ?? preferredVariant?.color ?? "";
        const nextSize = normalizeText(location.state?.selectedSize) ?? productDetail.sizes?.[0] ?? preferredVariant?.size ?? "";

        setProduct(productDetail);
        setLensTypes(availableLensTypes);
        setSelectedColor(nextColor);
        setSelectedSize(nextSize);
        setSelectedLensTypeId(String(availableLensTypes[0]?.lensTypeId ?? ""));
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        const message =
          getPrescriptionApiErrorMessage(
            loadError,
            getCatalogErrorMessage(
              loadError,
              getLensTypeErrorMessage(loadError, "Không thể tải luồng đặt kính theo toa lúc này."),
            ),
          ) || "Không thể tải luồng đặt kính theo toa lúc này.";

        setError(message);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void loadData();

    return () => {
      isMounted = false;
    };
  }, [location.state?.selectedColor, location.state?.selectedSize, productId]);

  const selectedVariant = useMemo(() => {
    if (!product) {
      return null;
    }

    const variants = Array.isArray(product.variants) ? product.variants : [];

    const exactMatch = variants.find((variant) => {
      const colorMatches = !selectedColor || variant.color === selectedColor;
      const sizeMatches = !selectedSize || variant.size === selectedSize;
      return colorMatches && sizeMatches;
    });

    return exactMatch ?? resolvePreferredVariant(product);
  }, [product, selectedColor, selectedSize]);

  const selectedLensType = useMemo(
    () => lensTypes.find((item) => String(item.lensTypeId) === String(selectedLensTypeId)) ?? null,
    [lensTypes, selectedLensTypeId],
  );

  const totalPrice = pricing.totalPrice || (Number(selectedVariant?.price ?? 0) + Number(selectedLensType?.price ?? 0));

  useEffect(() => {
    let isCancelled = false;

    async function loadPricing() {
      if (!selectedVariant?.variantId || !selectedLensType?.lensTypeId) {
        setPricing(INITIAL_PRICING_STATE);
        return;
      }

      setPricing((current) => ({
        ...current,
        status: "loading",
        error: "",
      }));

      try {
        const response = await calculatePrescriptionPricing({
          variantId: selectedVariant.variantId,
          lensTypeId: selectedLensType.lensTypeId,
          coatings: selectedCoatings,
          quantity: 1,
        });

        if (isCancelled) {
          return;
        }

        setPricing({
          status: "succeeded",
          error: "",
          framePrice: Number(response?.framePrice ?? 0),
          lensPrice: Number(response?.lensPrice ?? 0),
          coatingPrice: Number(response?.coatingPrice ?? 0),
          totalPrice: Number(response?.totalPrice ?? 0),
        });
      } catch (pricingError) {
        if (isCancelled) {
          return;
        }

        setPricing({
          status: "failed",
          error: getPrescriptionApiErrorMessage(pricingError, "Không thể tính giá prescription từ backend."),
          framePrice: Number(selectedVariant?.price ?? 0),
          lensPrice: Number(selectedLensType?.price ?? 0),
          coatingPrice: 0,
          totalPrice: Number(selectedVariant?.price ?? 0) + Number(selectedLensType?.price ?? 0),
        });
      }
    }

    void loadPricing();

    return () => {
      isCancelled = true;
    };
  }, [selectedCoatings, selectedLensType?.lensTypeId, selectedLensType?.price, selectedVariant?.price, selectedVariant?.variantId]);

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError("");

    if (!isCustomerSession) {
      navigate("/login");
      return;
    }

    if (!product?.prescriptionCompatible) {
      setFormError("Sản phẩm này không còn hỗ trợ prescription.");
      return;
    }

    if (!selectedVariant?.variantId) {
      setFormError("Không tìm thấy biến thể hợp lệ cho sản phẩm này.");
      return;
    }

    if (!selectedLensType?.lensTypeId) {
      setFormError("Vui lòng chọn loại tròng kính.");
      return;
    }

    const validationMessage = validatePrescriptionForm(formState);

    if (validationMessage) {
      setFormError(validationMessage);
      return;
    }

    try {
      setSubmitting(true);

      await addPrescriptionItem({
        variantId: selectedVariant.variantId,
        quantity: 1,
        lensTypeId: selectedLensType.lensTypeId,
        lensMaterial: normalizeOptionalField(formState.lensMaterial),
        coatings: selectedCoatings,
        rightEye: {
          sph: parseDecimal(formState.rightSph),
          cyl: parseDecimal(formState.rightCyl),
          axis: parseInteger(formState.rightAxis),
        },
        leftEye: {
          sph: parseDecimal(formState.leftSph),
          cyl: parseDecimal(formState.leftCyl),
          axis: parseInteger(formState.leftAxis),
        },
        pd: parseDecimal(formState.pd),
        notes: normalizeOptionalField(formState.notes),
        view: createCartItemView(product, selectedVariant),
      });

      navigate("/cart");
    } catch (submitError) {
      setFormError(resolveErrorMessage(submitError, "Không thể thêm sản phẩm theo toa vào giỏ hàng."));
    } finally {
      setSubmitting(false);
    }
  }

  function updateField(field, value) {
    setFormState((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function toggleCoating(coatingName) {
    setSelectedCoatings((current) =>
      current.includes(coatingName)
        ? current.filter((item) => item !== coatingName)
        : [...current, coatingName],
    );
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-[28px] border border-border bg-white p-8 shadow-sm">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          <p className="text-center text-muted-foreground">Đang tải luồng đặt kính theo toa...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <StateCard
        title="Flow prescription chưa sẵn sàng"
        description={error || "Không thể tải thông tin sản phẩm theo toa."}
      />
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <button
        type="button"
        onClick={() => navigate(`/product/${productId}`)}
        className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Quay lại chi tiết sản phẩm
      </button>

      <div className="mb-8 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-[28px] border border-border bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-start gap-4">
            <img
              src={product.image}
              alt={product.name}
              className="h-28 w-28 rounded-2xl object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs text-emerald-700">
                <Check className="h-3.5 w-3.5" />
                Hỗ trợ đo kính theo toa
              </p>
              <h1 className="text-3xl">{product.name}</h1>
              <p className="mt-2 text-muted-foreground leading-7">{product.description}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <section>
              <div className="mb-4">
                <h2 className="text-xl">1. Chọn biến thể gọng kính</h2>
                <p className="text-sm text-muted-foreground">Màu và kích thước này sẽ được đưa vào cart prescription.</p>
              </div>

              {product.colors.length > 0 && (
                <div className="mb-5">
                  <p className="mb-3 text-sm">Màu sắc</p>
                  <div className="flex flex-wrap gap-3">
                    {product.colors.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setSelectedColor(color)}
                        className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                          selectedColor === color ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/40"
                        }`}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {product.sizes.length > 0 && (
                <div>
                  <p className="mb-3 text-sm">Kích thước</p>
                  <div className="flex flex-wrap gap-3">
                    {product.sizes.map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setSelectedSize(size)}
                        className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                          selectedSize === size ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/40"
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </section>

            <section>
              <div className="mb-4">
                <h2 className="text-xl">2. Chọn loại tròng</h2>
                <p className="text-sm text-muted-foreground">Danh sách này đang đọc trực tiếp từ `GET /api/lens-types`.</p>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {lensTypes.map((lensType) => (
                  <button
                    key={lensType.lensTypeId}
                    type="button"
                    onClick={() => setSelectedLensTypeId(String(lensType.lensTypeId))}
                    className={`rounded-2xl border p-4 text-left transition-colors ${
                      String(selectedLensTypeId) === String(lensType.lensTypeId)
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/40"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p>{lensType.lensName}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{lensType.lensCode}</p>
                      </div>
                      <span className="text-primary">{formatCurrency(lensType.price)}</span>
                    </div>
                  </button>
                ))}
              </div>
            </section>

            <section>
              <div className="mb-4">
                <h2 className="text-xl">3. Nhập thông số toa kính</h2>
                <p className="text-sm text-muted-foreground">
                  Nếu toa của bạn không có CYL/AXIS, hãy nhập `0`. Backend hiện tại yêu cầu đầy đủ các trường này.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <NumericField label="SPH mắt phải" value={formState.rightSph} onChange={(value) => updateField("rightSph", value)} placeholder="-1.25" />
                <NumericField label="CYL mắt phải" value={formState.rightCyl} onChange={(value) => updateField("rightCyl", value)} placeholder="0.00" />
                <NumericField label="AXIS mắt phải" value={formState.rightAxis} onChange={(value) => updateField("rightAxis", value)} placeholder="0" />
                <NumericField label="SPH mắt trái" value={formState.leftSph} onChange={(value) => updateField("leftSph", value)} placeholder="-1.00" />
                <NumericField label="CYL mắt trái" value={formState.leftCyl} onChange={(value) => updateField("leftCyl", value)} placeholder="0.00" />
                <NumericField label="AXIS mắt trái" value={formState.leftAxis} onChange={(value) => updateField("leftAxis", value)} placeholder="0" />
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <NumericField label="PD" value={formState.pd} onChange={(value) => updateField("pd", value)} placeholder="63" />
                <TextField
                  label="Chất liệu tròng"
                  value={formState.lensMaterial}
                  onChange={(value) => updateField("lensMaterial", value)}
                  placeholder="Ví dụ: 1.56, 1.60..."
                />
              </div>
            </section>

            <section>
              <div className="mb-4">
                <h2 className="text-xl">4. Tùy chọn bổ sung</h2>
                <p className="text-sm text-muted-foreground">Coating hiện chưa tính thêm phí trên backend, nhưng đã lưu vào đơn prescription.</p>
              </div>

              <div className="mb-4 flex flex-wrap gap-3">
                {COATING_OPTIONS.map((coating) => {
                  const isSelected = selectedCoatings.includes(coating);

                  return (
                    <button
                      key={coating}
                      type="button"
                      onClick={() => toggleCoating(coating)}
                      className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                        isSelected ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/40"
                      }`}
                    >
                      {coating}
                    </button>
                  );
                })}
              </div>

              <label className="block">
                <span className="mb-2 block text-sm">Ghi chú</span>
                <textarea
                  value={formState.notes}
                  onChange={(event) => updateField("notes", event.target.value)}
                  placeholder="Ghi chú thêm cho đơn kính theo toa"
                  rows={4}
                  className="w-full rounded-2xl border border-border bg-background px-4 py-3 outline-none transition-colors focus:border-primary"
                />
              </label>
            </section>

            {formError && (
              <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                <p className="text-sm leading-6">{formError}</p>
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={submitting || pricing.status === "loading"}
                className="inline-flex items-center gap-2 rounded-2xl bg-primary px-6 py-3 text-white transition-colors hover:bg-primary/90 disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Đang thêm vào giỏ...
                  </>
                ) : pricing.status === "loading" ? (
                  <>
                    <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Đang tính giá từ backend...
                  </>
                ) : (
                  <>
                    <ShoppingCart className="h-4 w-4" />
                    Thêm đơn kính vào giỏ
                  </>
                )}
              </button>

              {!isCustomerSession && (
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 rounded-2xl border border-border px-6 py-3 transition-colors hover:bg-secondary"
                >
                  Đăng nhập để đặt hàng
                </Link>
              )}
            </div>
          </form>
        </section>

        <aside className="h-fit rounded-[28px] border border-border bg-white p-6 shadow-sm lg:sticky lg:top-24">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Eye className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl">Tóm tắt đơn kính</h2>
              <p className="text-sm text-muted-foreground">Bạn xem nhanh trước khi thêm vào giỏ.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl bg-secondary/60 p-4">
              <p className="text-sm text-muted-foreground">Biến thể đã chọn</p>
              <p className="mt-2">{selectedColor || selectedVariant?.color || "Mặc định"}</p>
              <p className="text-sm text-muted-foreground">{selectedSize || selectedVariant?.size || "Không có size"}</p>
              <p className="mt-3 text-sm text-muted-foreground">SKU: {selectedVariant?.sku || "Đang cập nhật"}</p>
            </div>

            <div className="rounded-2xl bg-secondary/60 p-4">
              <p className="text-sm text-muted-foreground">Tròng kính</p>
              <p className="mt-2">{selectedLensType?.lensName || "Chưa chọn"}</p>
              <p className="text-sm text-primary">{formatCurrency(pricing.lensPrice || selectedLensType?.price || 0)}</p>
            </div>

            <div className="rounded-2xl bg-secondary/60 p-4">
              <p className="text-sm text-muted-foreground">Coatings</p>
              <p className="mt-2 text-sm">
                {selectedCoatings.length > 0 ? selectedCoatings.join(", ") : "Chưa chọn coating bổ sung"}
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
              Tổng tạm tính: <span className="font-semibold">{formatCurrency(totalPrice)}</span>
              <p className="mt-2 text-emerald-800">
                Giá này đang ưu tiên đọc từ `POST /api/prescription-pricings/calculate`.
              </p>
            </div>

            {pricing.error ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                {pricing.error}
                <p className="mt-2">Tạm thời FE đang fallback về phép cộng local giá gọng + giá lens.</p>
              </div>
            ) : null}

            <div className="rounded-2xl bg-secondary/60 p-4 text-sm text-muted-foreground">
              Checkout hiện tại đã có thể gửi cart item theo toa, miễn là giỏ hàng chỉ gồm cùng một loại đơn.
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function NumericField({ label, value, onChange, placeholder }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-border bg-background px-4 py-3 outline-none transition-colors focus:border-primary"
      />
    </label>
  );
}

function TextField({ label, value, onChange, placeholder }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-border bg-background px-4 py-3 outline-none transition-colors focus:border-primary"
      />
    </label>
  );
}

function StateCard({ title, description }) {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="rounded-[28px] border border-border bg-white px-8 py-16 text-center shadow-sm">
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary">
          <AlertCircle className="h-10 w-10" />
        </div>
        <h1 className="mb-3 text-3xl">{title}</h1>
        <p className="mx-auto mb-8 max-w-2xl text-muted-foreground leading-7">{description}</p>
        <div className="flex justify-center gap-3">
          <Link
            to="/shop"
            className="rounded-2xl bg-primary px-5 py-3 text-white transition-colors hover:bg-primary/90"
          >
            Quay về cửa hàng
          </Link>
        </div>
      </div>
    </div>
  );
}

function validatePrescriptionForm(formState) {
  const requiredDecimalFields = [
    { key: "rightSph", label: "SPH mắt phải" },
    { key: "rightCyl", label: "CYL mắt phải" },
    { key: "leftSph", label: "SPH mắt trái" },
    { key: "leftCyl", label: "CYL mắt trái" },
    { key: "pd", label: "PD" },
  ];

  for (const field of requiredDecimalFields) {
    if (!isFiniteNumber(formState[field.key])) {
      return `${field.label} phải là số hợp lệ.`;
    }
  }

  const axisFields = [
    { key: "rightAxis", label: "AXIS mắt phải" },
    { key: "leftAxis", label: "AXIS mắt trái" },
  ];

  for (const field of axisFields) {
    if (!isValidAxis(formState[field.key])) {
      return `${field.label} phải nằm trong khoảng 0-180.`;
    }
  }

  if (parseDecimal(formState.pd) <= 0) {
    return "PD phải lớn hơn 0.";
  }

  return "";
}

function isFiniteNumber(value) {
  return Number.isFinite(parseDecimal(value));
}

function isValidAxis(value) {
  const parsedValue = parseInteger(value);
  return Number.isInteger(parsedValue) && parsedValue >= 0 && parsedValue <= 180;
}

function parseDecimal(value) {
  return Number.parseFloat(String(value ?? "").trim().replace(",", "."));
}

function parseInteger(value) {
  return Number.parseInt(String(value ?? "").trim(), 10);
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

function normalizeOptionalField(value) {
  const normalizedValue = String(value ?? "").trim();
  return normalizedValue.length > 0 ? normalizedValue : undefined;
}

function normalizeText(value) {
  const normalizedValue = String(value ?? "").trim();
  return normalizedValue.length > 0 ? normalizedValue : null;
}

function formatCurrency(value) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(Number(value ?? 0));
}


